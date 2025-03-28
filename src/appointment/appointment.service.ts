import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AppointmentDto,
  CallPatientDto,
  CreateTimeSlotDto,
  PatientDto,
  UpdateTimeSlotDto,
} from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  public async getAppointmentByDate(date: string) {
    const [day, month, year] = date.split('.').map(Number);
    const parsedDate = new Date(year, month - 1, day);

    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid date format. Expected DD.MM.YYYY');
    }

    // Adjust to query only the DATE part
    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const appointments = await this.prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: startOfDay, // Start of the given day
            lte: endOfDay, // End of the given day
          },
        },
        include: {
          patient: true,
          timeSlot: true,
          management: true,
        },
      });

      return appointments;
    } catch (error) {
      Logger.error('Failed to fetch appointments', error);
      throw new InternalServerErrorException('Failed to fetch appointments');
    }
  }

  public async createAppointment(appointmentDto: AppointmentDto) {
    try {
      let patient = await this.prisma.patient.findFirst({
        where: {
          sex: appointmentDto.sex,
          firstName: appointmentDto.firstName,
          lastName: appointmentDto.lastName,
          fatherName: appointmentDto.fatherName,
        },
      });

      // Create patient if not exists
      if (!patient) {
        patient = await this.prisma.patient.create({
          data: {
            firstName: appointmentDto.firstName,
            lastName: appointmentDto.lastName,
            sex: appointmentDto.sex,
            birthday: new Date(appointmentDto.birthday),
            fatherName: appointmentDto.fatherName,
          },
        });
      }

      const appointmentDate = new Date(appointmentDto.appointmentDate);

      // Check if the patient already has 2 appointments for the same day
      const existingAppointmentsCount = await this.prisma.appointment.count({
        where: {
          patientUid: patient.uid,
          appointmentDate: {
            gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
            lt: new Date(appointmentDate.setHours(24, 0, 0, 0)),
          },
        },
      });

      if (existingAppointmentsCount >= 2) {
        throw new BadRequestException(
          'A patient can only book up to 2 appointments per day.',
        );
      }

      const appointment = await this.prisma.appointment.create({
        data: {
          appointmentDate: new Date(appointmentDto.appointmentDate),
          patientUid: patient.uid,
          appointmentNumber: Math.floor(Math.random() * 1000000),
          createdAt: new Date(),
          updatedAt: new Date(),
          appointmentTimeSlotUid: appointmentDto.appointmentTimeSlotUid,
          isNewPatient: appointmentDto.isNewPatient,
          comment: appointmentDto.comment,
        },
      });

      const timSlotOrder = await this.prisma.appointmentTimeSlot.findFirst({
        select: { appointmentOrder: true },
        where: { uid: appointmentDto.appointmentTimeSlotUid },
      });

      return {
        success: true,
        appointmentNumber: appointment.appointmentNumber,
        appointmentDate: appointment.appointmentDate,
        appointmentOrder: timSlotOrder?.appointmentOrder || 0,
      };
    } catch (e) {
      Logger.error('Failed to create appointment', e);
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new BadRequestException(
            'An appointment already exists for this date and time slot.',
          );
        }
      }
      throw new BadRequestException('Failed to create appointment.');
    }
  }

  public async callPatient(callPatientDto: CallPatientDto) {
    try {
      const appointment = await this.prisma.appointmentManagement.upsert({
        where: {
          appointmentUid: callPatientDto.appointmentUid,
        },
        update: {
          endDate: new Date(),
        },
        create: {
          appointmentUid: callPatientDto.appointmentUid,
          startDate: new Date(),
        },
      });

      return {
        success: true,
        appointmentUid: appointment.appointmentUid,
        startDate: appointment.startDate,
        endDate: appointment.endDate,
      };
    } catch (error) {
      Logger.error('Failed to call patient', error);
      throw new BadRequestException('Failed to call patient.');
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
          timeSlot: true,
        },
      });

      const totalAppointments = appointments.length;

      // Find completed appointments (where startDate exists but endDate does not)
      const completedAppointments = appointments.filter(
        (appointment) =>
          appointment.management?.startDate && !appointment.management?.endDate,
      ).length;

      // Find the current appointment order number (if exists)
      const currentAppointment = appointments.find(
        (appointment) =>
          appointment.management?.startDate && !appointment.management?.endDate,
      );
      let currentAppointmentOrder =
        currentAppointment?.timeSlot?.appointmentOrder;

      if (currentAppointmentOrder === undefined) {
        currentAppointmentOrder = appointments
          .sort(
            (a, b) => b.timeSlot.appointmentOrder - a.timeSlot.appointmentOrder,
          )
          .find(
            (appointment) =>
              appointment.management?.startDate &&
              appointment.management?.endDate,
          )?.timeSlot.appointmentOrder;
      }

      return {
        totalAppointments,
        completedAppointments,
        currentAppointmentOrder: currentAppointmentOrder ?? 0,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          'Database error while fetching appointments.',
        );
      }
      throw new InternalServerErrorException(
        'Failed to get appointment summary.',
      );
    }
  }

  public async getAvailableTimeSlots(date: string) {
    try {
      if (!date) {
        throw new BadRequestException('Date parameter is required.');
      }

      const formattedDate = new Date(date);

      if (isNaN(formattedDate.getTime())) {
        throw new BadRequestException(
          'Invalid date format. Please provide a valid date.',
        );
      }

      const bookedTimeSlots = await this.prisma.appointment.findMany({
        where: {
          appointmentDate: formattedDate,
          deletedAt: null,
        },
        select: {
          appointmentTimeSlotUid: true,
        },
      });

      // Extract the UIDs of booked time slots
      const bookedSlotUids = bookedTimeSlots
        .map((slot) => slot.appointmentTimeSlotUid)
        .filter((uid) => uid !== null);

      // Fetch all time slots that are NOT in the booked slots list
      const now = new Date(); // Get current date and time
      const nowHours = now.getHours();
      const nowMinutes = now.getMinutes();
      const today = now.toISOString().split('T')[0];

      const availableTimeSlots = await this.prisma.appointmentTimeSlot.findMany(
        {
          where: {
            NOT: {
              uid: { in: bookedSlotUids },
            },
          },
        },
      );

      // Filter time slots to include only those that are strictly after the current time
      const filteredTimeSlots = availableTimeSlots.filter((slot) => {
        const [slotHours, slotMinutes] = slot.appointmentHour
          .split(':')
          .map(Number); // Extract hours and minutes

        // Check if the slot date matches today's date
        if (today === date) {
          // If it's today, apply the time filter
          return (
            slotHours > nowHours + 1 ||
            (slotHours === nowHours + 1 && slotMinutes > nowMinutes + 1)
          );
        }

        // If it's not today, keep the slot
        return true;
      });

      return {
        success: true,
        availableTimeSlots: filteredTimeSlots,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new BadRequestException(
          'Database error while fetching available time slots.',
        );
      }
      throw new BadRequestException('Failed to get available time slots.');
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
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'A time slot with this order or hour already exists.',
          );
        }
      }
      throw new BadRequestException('Failed to create time slot.');
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
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Time slot not found.');
        }
      }
      throw new BadRequestException('Failed to update time slot.');
    }
  }

  public async deleteTimeSlot(uid: string) {
    try {
      await this.prisma.appointmentTimeSlot.delete({ where: { uid } });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Time slot not found.');
        }
      }
      throw new BadRequestException('Failed to delete time slot.');
    }
  }

  public async getAppointmentByPatient(patient: PatientDto) {
    try {
      const patientRecord = await this.prisma.patient.findFirst({
        where: {
          firstName: patient.firstName,
          lastName: patient.lastName,
          birthday: new Date(patient.birthday),
          fatherName: patient.fatherName,
        },
      });

      if (!patientRecord) {
        throw new NotFoundException('Patient not found');
      }

      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );

      const appointment = await this.prisma.appointment.findMany({
        where: {
          patientUid: patientRecord.uid,
          deletedAt: null,
          appointmentDate: {
            gte: startOfToday,
          },
        },
        include: {
          timeSlot: true,
          patient: true,
          management: true,
        },
        orderBy: {
          appointmentDate: 'desc',
        },
      });
      // Filter appointments where the time slot is after the current time
      const filteredAppointments = appointment.filter(
        (appointment) => !appointment.management?.startDate,
      );

      // Return filtered appointments
      return filteredAppointments.map((appointment) => ({
        appointmentNumber: appointment.appointmentNumber,
        appointmentDate: appointment.appointmentDate,
        appointmentTimeSlot: appointment.timeSlot?.appointmentHour,
        id: appointment.id,
      }));
    } catch (error) {
      Logger.error(error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError) {
        throw new BadRequestException('Failed to get appointment by patient.');
      }
      throw new BadRequestException('Failed to get appointment by patient.');
    }
  }

  public async deleteAppointment(id: string) {
    try {
      await this.prisma.appointment.delete({ where: { id } });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new BadRequestException('Failed to delete appointment.');
      }
      throw new BadRequestException('Failed to delete appointment.');
    }
  }
}
