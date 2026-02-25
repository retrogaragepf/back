import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotificationType } from './notification-type.enum';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  async getMyNotifications(
    @Req() req,
    @Query('excludeTypes') excludeTypes?: string,
    @Query('includeDailySummary') includeDailySummary?: string,
  ) {
    const userId = req.user.id;
    const parsedExcludeTypes = new Set<NotificationType>();

    if (excludeTypes) {
      excludeTypes
        .split(',')
        .map((value) => value.trim())
        .filter((value): value is NotificationType =>
          Object.values(NotificationType).includes(value as NotificationType),
        )
        .forEach((value) => parsedExcludeTypes.add(value));
    }

    if (includeDailySummary === 'false') {
      parsedExcludeTypes.add(NotificationType.DAILY_SUMMARY);
    }

    return this.notificationsService.getUserNotifications(userId, {
      excludeTypes: Array.from(parsedExcludeTypes),
    });
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return this.notificationsService.markAsRead(id, userId);
  }
}
