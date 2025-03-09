import {
  IsString,
  IsDate,
  IsPhoneNumber,
  IsEnum,
  IsNotEmpty,
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
  @IsPhoneNumber()
  phoneNumber: string;

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
}
