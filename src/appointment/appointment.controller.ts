import { Controller, Get } from '@nestjs/common';
import { AppointmentService } from './appointment.service';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmenService: AppointmentService) {}

  @Get('count-for-today')
  public getTodayAppointmentSummary() {
    return this.appointmenService.getTodayAppointmentSummary();
  }
}
