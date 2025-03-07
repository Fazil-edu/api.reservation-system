import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}
  @Get()
  async getPatients() {
    return await this.patientService.getPatients();
  }

  @Get(':id')
  async getPatientById(@Param('id') id: string) {
    return await this.patientService.getPatientById(id);
  }

  @Post()
  async createPatient(@Body() createPatientDto: CreatePatientDto) {
    return await this.patientService.createPatient(createPatientDto);
  }

  @Put(':id')
  async updatePatient(
    @Body() updatePatientDto: UpdatePatientDto,
    @Param('id') id: string,
  ) {
    return await this.patientService.updatePatient(updatePatientDto, id);
  }

  @Delete(':id')
  async deletePatient(@Param('id') id: string) {
    return await this.patientService.deletePatient(id);
  }
}
