import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { TeamsModule } from './teams/teams.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmployeesModule } from './employees/employees.module';
import { HolidaysModule } from './holidays/holidays.module';
import { ScheduleModule } from './schedule/schedule.module';
import { RosterModule } from './roster/roster.module';
import { DutyRulesModule } from './duty-rules/duty-rules.module';
import { DutyAssignmentsModule } from './duty-assignments/duty-assignments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    TeamsModule,
    DashboardModule,
    EmployeesModule,
    HolidaysModule,
    ScheduleModule,
    RosterModule,
    DutyRulesModule,
    DutyAssignmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
