import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentDto } from './dto/create-appointment.dto';
import { Observable } from 'rxjs';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('count-for-today')
  public getTodayAppointmentSummary() {
    return this.appointmentService.getTodayAppointmentSummary();
  }

  @Post('create')
  public create(@Body() createAppointmentDto: AppointmentDto): Observable<any> {
    return this.appointmentService.createAppointment(createAppointmentDto);
  }
}
