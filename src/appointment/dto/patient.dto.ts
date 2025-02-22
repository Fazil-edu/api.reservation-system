import { OmitType } from '@nestjs/mapped-types';
import { AppointmentDto } from './create-appointment.dto';

export class PatientDto extends OmitType(AppointmentDto, [
  'appointmentDate',
  'appointmentTimeSlotUid',
  'sex',
] as const) {}
