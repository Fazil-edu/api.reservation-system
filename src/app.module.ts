import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentModule } from './appointment/appointment.module';
import { PatientModule } from './patient/patient.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AppointmentModule, PatientModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
