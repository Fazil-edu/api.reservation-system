import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTimeSlotDto {
  @IsNotEmpty()
  @IsString()
  appointmentHour: string;

  @IsNotEmpty()
  @IsNumber()
  appointmentOrder: number;
}
