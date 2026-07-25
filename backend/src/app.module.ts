import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmployeesModule } from './employees/employees.module';
import { HolidaysModule } from './holidays/holidays.module';
import { ScheduleModule } from './schedule/schedule.module';
import { RosterModule } from './roster/roster.module';
import { DutyRulesModule } from './duty-rules/duty-rules.module';
import { DutyAssignmentsModule } from './duty-assignments/duty-assignments.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    TeamsModule,
    DashboardModule,
    EmployeesModule,
    HolidaysModule,
    ScheduleModule,
    RosterModule,
    DutyRulesModule,
    DutyAssignmentsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
