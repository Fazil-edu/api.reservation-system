import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('count-for-today')
  public getTodayAppointmentSummary() {
    return this.appointmentService.getTodayAppointmentSummary();
  }

  @Post('create')
  public async create(@Body() createAppointmentDto: AppointmentDto) {
    return await this.appointmentService.createAppointment(
      createAppointmentDto,
    );
  }
}
