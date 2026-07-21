import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateCustomerDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(60)
  firstName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(60)
  lastName: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  @IsString()
  @Length(7, 8, { message: 'El DNI debe tener entre 7 y 8 dígitos' })
  @Matches(/^\d+$/, { message: 'El DNI solo puede contener números' })
  dni: string;

  @Transform(trim)
  @IsOptional()
  @IsEmail({}, { message: 'Ingresá un email válido' })
  @MaxLength(120)
  email?: string;
}
