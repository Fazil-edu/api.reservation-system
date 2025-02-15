import { Injectable } from '@nestjs/common';
import { from } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AppointmentService {
  constructor(private readonly prismaService: PrismaService) {}

  public getTodayAppointmentSummary() {
    const today = new Date();
    const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0)); // Start of the day
    const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999)); // End of the day

    return from(
      this.prismaService.appointment.findMany({
        where: {
          appointmentDate: {
            gte: startOfDay.toISOString(), // Greater than or equal to start of day
            lt: endOfDay.toISOString(), // Less than end of day
          },
        },
      }),
    );
  }
}
