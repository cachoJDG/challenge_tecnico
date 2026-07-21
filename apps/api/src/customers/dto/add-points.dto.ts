import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class AddPointsDto {
  @Type(() => Number)
  @IsInt({ message: 'Los puntos deben ser un número entero' })
  @Min(1, { message: 'La cantidad mínima es 1 punto' })
  @Max(1000, { message: 'No se pueden acreditar más de 1.000 puntos' })
  points: number;
}
