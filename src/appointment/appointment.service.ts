import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentDto } from './dto/create-appointment.dto';
import { from, map, switchMap } from 'rxjs';

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  public createAppointment(appointmentDto: AppointmentDto) {
    return from(
      this.prisma.patient.upsert({
        where: { phoneNumber: appointmentDto.phoneNumber },
        create: {
          firstName: appointmentDto.firstName,
          lastName: appointmentDto.lastName,
          phoneNumber: appointmentDto.phoneNumber,
          sex: appointmentDto.sex,
        },
        update: {
          firstName: appointmentDto.firstName,
          lastName: appointmentDto.lastName,
          sex: appointmentDto.sex,
        },
      }),
    ).pipe(
      switchMap((patient) =>
        from(
          this.prisma.appointment.create({
            data: {
              appointmentDate: appointmentDto.appointmentDate,
              patientUid: patient.uid,
              appointmentNumber: Math.floor(Math.random() * 1000000),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            include: {
              patient: true,
            },
          }),
        ),
      ),
    );
  }

  public getTodayAppointmentSummary() {
    const today = new Date();
    const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0)); // Start of the day
    const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999)); // End of the day

    return from(
      this.prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: startOfDay.toISOString(), // Greater than or equal to start of day
            lt: endOfDay.toISOString(), // Less than end of day
          },
        },
      }),
    ).pipe(
      map((appointments) => ({ count: appointments.length, currentNumber: 0 })),
    );
  }
}
