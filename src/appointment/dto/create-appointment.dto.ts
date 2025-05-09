import {
  IsString,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';

enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export class AppointmentDto {
  @IsNotEmpty()
  @IsDate()
  appointmentDate: Date;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  sex: Gender;

  @IsNotEmpty()
  @IsString()
  appointmentTimeSlotUid: string;

  @IsNotEmpty()
  @IsString()
  comment: string;

  @IsNotEmpty()
  @IsString()
  birthday: string;

  @IsNotEmpty()
  @IsString()
  fatherName: string;

  @IsBoolean()
  isNewPatient?: boolean;
}
