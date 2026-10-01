import { IsNumber, IsNotEmpty } from 'class-validator';

export class ExchangeClassDto {
  @IsNotEmpty()
  @IsNumber()
  event_id1!: number;

  @IsNotEmpty()
  @IsNumber()
  teacher_id1!: number;

  @IsNotEmpty()
  @IsNumber()
  event_id2!: number;

  @IsNotEmpty()
  @IsNumber()
  teacher_id2!: number;
}