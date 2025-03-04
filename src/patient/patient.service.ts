import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';

@Injectable()
export class PatientService {
  constructor(private prismaService: PrismaService) {}

  async getPatients() {
    try {
      const patients = await this.prismaService.patient.findMany();
      return patients;
    } catch (error) {
      Logger.error('Failed to get patients', error);
      throw new Error('Failed to get patients');
    }
  }

  async getPatientById(id: string) {
    try {
      const patient = await this.prismaService.patient.findUnique({
        where: { uid: id },
        include: {
          appointments: { include: { timeSlot: true } },
          diagnoses: true,
          details: true,
        },
      });
      if (!patient) {
        throw new Error('Patient not found');
      }
      return patient;
    } catch (error) {
      Logger.error('Failed to get patient by ID', error);
      throw new Error('Failed to get patient by ID');
    }
  }

  async createPatient(patientData: CreatePatientDto) {
    try {
      const patient = await this.prismaService.patient.create({
        data: patientData,
      });
      return patient;
    } catch (error) {
      Logger.error('Failed to create patient', error);
      throw new Error('Failed to create patient');
    }
  }

  async updatePatient(data: UpdatePatientDto, id: string) {
    try {
      await this.prismaService.patient.update({
        data,
        where: { uid: id },
      });
    } catch (error) {
      Logger.error('Failed to update patient', error);
      throw new Error('Failed to update patient');
    }
  }

  async deletePatient(id: string) {
    try {
      await this.prismaService.patient.delete({
        where: { uid: id },
      });
    } catch (error) {
      Logger.error('Failed to delete patient', error);
      throw new Error('Failed to delete patient');
    }
  }
}
