import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddPointsDto } from './dto/add-points.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from './customer.interface';

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1,
    firstName: 'Juan',
    lastName: 'Pérez',
    dni: '30111222',
    email: 'juan.perez@gmail.com',
    points: 450,
  },
  {
    id: 2,
    firstName: 'Juan',
    lastName: 'Pérez',
    dni: '35444555',
    email: 'jperez@hotmail.com',
    points: 120,
  },
  {
    id: 3,
    firstName: 'Juana',
    lastName: 'Pereyra',
    dni: '38777888',
    email: 'juana@gmail.com',
    points: 900,
  },
  {
    id: 4,
    firstName: 'Martín',
    lastName: 'Gómez',
    dni: '33222333',
    email: 'martin.gomez@gmail.com',
    points: 250,
  },
];

@Injectable()
export class CustomersService {
  private readonly customers = structuredClone(INITIAL_CUSTOMERS);
  private nextId = Math.max(...this.customers.map(({ id }) => id)) + 1;

  search(query = ''): Customer[] {
    const normalizedQuery = this.normalizeText(query.trim());
    const digits = query.replace(/\D/g, '');

    if (!normalizedQuery) return [];

    return this.customers
      .filter((customer) => {
        const fullName = this.normalizeText(
          `${customer.firstName} ${customer.lastName}`,
        );
        return (
          fullName.includes(normalizedQuery) ||
          this.normalizeText(customer.email ?? '').includes(normalizedQuery) ||
          (digits.length >= 2 && customer.dni.startsWith(digits))
        );
      })
      .slice(0, 10)
      .map((customer) => ({ ...customer }));
  }

  create(dto: CreateCustomerDto): Customer {
    if (this.customers.some(({ dni }) => dni === dto.dni)) {
      throw new ConflictException('Ya existe un cliente registrado con ese DNI');
    }

    const customer: Customer = {
      id: this.nextId++,
      firstName: this.toDisplayCase(dto.firstName),
      lastName: this.toDisplayCase(dto.lastName),
      dni: dto.dni,
      ...(dto.email ? { email: dto.email.toLowerCase() } : {}),
      points: 0,
    };

    this.customers.push(customer);
    return { ...customer };
  }

  addPoints(id: number, dto: AddPointsDto): Customer {
    const customer = this.customers.find((item) => item.id === id);

    if (!customer) {
      throw new NotFoundException('El cliente no existe');
    }

    customer.points += dto.points;
    return { ...customer };
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es');
  }

  private toDisplayCase(value: string): string {
    return value
      .toLocaleLowerCase('es')
      .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('es'));
  }
}
