import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentDto } from './dto/create-appointment.dto';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';

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

  @Post('create-time-slot')
  public async createTimeSlot(@Body() createTimeSlotDto: CreateTimeSlotDto) {
    return await this.appointmentService.createTimeSlot(createTimeSlotDto);
  }

  @Put('update-time-slot/:uid')
  public async updateTimeSlot(
    @Body() updateTimeSlotDto: UpdateTimeSlotDto,
    @Param('uid') uid: string,
  ) {
    return await this.appointmentService.updateTimeSlot(updateTimeSlotDto, uid);
  }

  @Delete('delete-time-slot/:uid')
  public async deleteTimeSlot(@Param('uid') uid: string) {
    return await this.appointmentService.deleteTimeSlot(uid);
  }
}
