import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from '../auth/auth.module';
import { SettingsController } from './settings.controller';
import { SettingsGuard } from './settings.guard';
import { SettingsService } from './settings.service';

@Module({
  imports: [AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService, { provide: APP_GUARD, useClass: SettingsGuard }],
})
export class SettingsModule {}
