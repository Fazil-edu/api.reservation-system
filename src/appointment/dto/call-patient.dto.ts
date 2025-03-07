import { IsNotEmpty, IsString } from 'class-validator';

export class CallPatientDto {
  @IsNotEmpty()
  @IsString()
  appointmentUid: string;
}
