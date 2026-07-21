import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Customer } from './customer.model';

export interface CreateCustomerPayload {
  firstName: string;
  lastName: string;
  dni: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/customers';

  search(query: string): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.baseUrl, { params: { query } });
  }

  create(payload: CreateCustomerPayload): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, payload);
  }

  addPoints(customerId: number, points: number): Observable<Customer> {
    return this.http.post<Customer>(`${this.baseUrl}/${customerId}/points`, {
      points,
    });
  }
}
