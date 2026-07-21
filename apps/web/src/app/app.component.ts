import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { ApiError, Customer } from './customer.model';
import { CustomersService } from './customers.service';

type View = 'search' | 'create' | 'points' | 'success';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  @ViewChild('pointsInput') pointsInput?: ElementRef<HTMLInputElement>;

  private readonly customersService = inject(CustomersService);
  private readonly destroyRef = inject(DestroyRef);

  readonly view = signal<View>('search');
  readonly results = signal<Customer[]>([]);
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly isSearching = signal(false);
  readonly searchCompleted = signal(false);
  readonly isSubmitting = signal(false);
  readonly message = signal('');

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly createForm = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    dni: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^\d+$/),
        Validators.minLength(7),
        Validators.maxLength(8),
      ],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(120)],
    }),
  });
  readonly pointsControl = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(1),
    Validators.max(1000),
    Validators.pattern(/^\d+$/),
  ]);
  readonly pointsForm = new FormGroup({
    points: this.pointsControl,
  });
  private readonly enteredPoints = toSignal(this.pointsControl.valueChanges, {
    initialValue: this.pointsControl.value,
  });

  readonly pointsPreview = computed(() => {
    const customer = this.selectedCustomer();
    const points = this.enteredPoints();
    return customer && points && this.pointsControl.valid
      ? customer.points + points
      : customer?.points ?? 0;
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        tap(() => {
          this.message.set('');
          this.searchCompleted.set(false);
        }),
        debounceTime(280),
        distinctUntilChanged(),
        switchMap((query) => {
          const cleanQuery = query.trim();
          if (cleanQuery.length < 2) {
            this.results.set([]);
            this.isSearching.set(false);
            return of(null);
          }

          this.isSearching.set(true);
          return this.customersService.search(cleanQuery).pipe(
            catchError((error: HttpErrorResponse) => {
              this.message.set(this.getErrorMessage(error));
              this.results.set([]);
              return of([]);
            }),
            finalize(() => this.isSearching.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((customers) => {
        if (customers === null) return;
        this.results.set(customers);
        this.searchCompleted.set(true);
      });
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.pointsControl.reset();
    this.message.set('');
    this.view.set('points');
    setTimeout(() => this.pointsInput?.nativeElement.focus());
  }

  openCreate(): void {
    const query = this.searchControl.value.trim();
    const onlyDigits = query.replace(/\D/g, '');
    const words = query.split(/\s+/).filter(Boolean);

    this.createForm.reset({
      firstName: /^\D+$/.test(query) ? (words[0] ?? '') : '',
      lastName: /^\D+$/.test(query) ? words.slice(1).join(' ') : '',
      dni: onlyDigits.length >= 7 ? onlyDigits.slice(0, 8) : '',
      email: '',
    });
    this.message.set('');
    this.view.set('create');
  }

  createCustomer(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.message.set('');
    const raw = this.createForm.getRawValue();

    this.customersService
      .create({
        ...raw,
        ...(raw.email.trim() ? { email: raw.email.trim() } : {}),
      })
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (customer) => {
          this.selectedCustomer.set(customer);
          this.pointsControl.reset();
          this.view.set('points');
          setTimeout(() => this.pointsInput?.nativeElement.focus());
        },
        error: (error: HttpErrorResponse) => this.handleCreateError(error),
      });
  }

  addPoints(): void {
    const customer = this.selectedCustomer();
    if (!customer || this.pointsControl.invalid || !this.pointsControl.value) {
      this.pointsControl.markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.message.set('');
    this.customersService
      .addPoints(customer.id, this.pointsControl.value)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updatedCustomer) => {
          this.selectedCustomer.set(updatedCustomer);
          this.view.set('success');
        },
        error: (error: HttpErrorResponse) =>
          this.message.set(this.getErrorMessage(error)),
      });
  }

  setQuickPoints(points: number): void {
    this.pointsControl.setValue(points);
    this.pointsControl.markAsDirty();
    this.pointsInput?.nativeElement.focus();
  }

  backToSearch(): void {
    this.selectedCustomer.set(null);
    this.pointsControl.reset();
    this.message.set('');
    this.view.set('search');
  }

  startNewOperation(): void {
    this.searchControl.setValue('');
    this.results.set([]);
    this.searchCompleted.set(false);
    this.backToSearch();
  }

  formatDni(dni: string): string {
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  trackByCustomerId(_: number, customer: Customer): number {
    return customer.id;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    const apiError = error as ApiError;
    const apiMessage = apiError.error?.message;
    if (Array.isArray(apiMessage)) return apiMessage[0] ?? 'Revisá los datos ingresados.';
    return apiMessage ?? 'No pudimos completar la operación. Intentá nuevamente.';
  }

  private handleCreateError(error: HttpErrorResponse): void {
    const errorMessage = this.getErrorMessage(error);

    if (errorMessage.toLocaleLowerCase('es').includes('dni')) {
      const dniControl = this.createForm.controls.dni;
      dniControl.setErrors({
        ...dniControl.errors,
        server: errorMessage,
      });
      dniControl.markAsTouched();
      this.message.set('');
      return;
    }

    this.message.set(errorMessage);
  }
}
