import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentDto, CreateTimeSlotDto, UpdateTimeSlotDto } from './dto';

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  public async createAppointment(appointmentDto: AppointmentDto) {
    try {
      const patient = await this.prisma.patient.upsert({
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
      });

      const appointment = await this.prisma.appointment.create({
        data: {
          appointmentDate: appointmentDto.appointmentDate,
          patientUid: patient.uid,
          appointmentNumber: Math.floor(Math.random() * 1000000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        appointmentNumber: appointment.appointmentNumber,
        appointmentDate: appointment.appointmentDate,
      };
    } catch (error) {
      throw new BadRequestException('Failed to create appointment: ' + error);
    }
  }

  public async getTodayAppointmentSummary() {
    try {
      const today = new Date();
      const startOfDay = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
          0,
          0,
          0,
          0,
        ),
      );
      const endOfDay = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );

      const appointments = await this.prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: startOfDay.toISOString(),
            lt: endOfDay.toISOString(),
          },
        },
        include: {
          management: true,
        },
      });

      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(
        (appointment) =>
          appointment.management?.startDate &&
          appointment.management?.endDate &&
          !appointment.management?.isCanceled,
      ).length;

      return {
        totalAppointments,
        completedAppointments,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get appointment summary: ' + error,
      );
    }
  }

  public async createTimeSlot(createTimeSlotDto: CreateTimeSlotDto) {
    try {
      const timeSlot = await this.prisma.appointmentTimeSlot.create({
        data: {
          appointmentHour: createTimeSlotDto.appointmentHour,
          appointmentOrder: createTimeSlotDto.appointmentOrder,
        },
      });

      return {
        success: true,
        appointmentHour: timeSlot.appointmentHour,
        appointmentOrder: timeSlot.appointmentOrder,
      };
    } catch (error) {
      throw new BadRequestException('Failed to create time slot: ' + error);
    }
  }

  public async updateTimeSlot(
    updateTimeSlotDto: UpdateTimeSlotDto,
    uid: string,
  ) {
    try {
      const timeSlot = await this.prisma.appointmentTimeSlot.update({
        where: { uid },
        data: {
          appointmentHour: updateTimeSlotDto.appointmentHour,
          appointmentOrder: updateTimeSlotDto.appointmentOrder,
        },
      });

      return {
        success: true,
        appointmentHour: timeSlot.appointmentHour,
        appointmentOrder: timeSlot.appointmentOrder,
      };
    } catch (error) {
      throw new BadRequestException('Failed to update time slot: ' + error);
    }
  }

  public async deleteTimeSlot(uid: string) {
    try {
      await this.prisma.appointmentTimeSlot.delete({ where: { uid } });

      return {
        success: true,
      };
    } catch (error) {
      throw new BadRequestException('Failed to delete time slot: ' + error);
    }
  }
}
