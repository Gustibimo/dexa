import {
  Controller,
  Query,
  Sse,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Sse('stream')
  stream(@Query('token') token: string): Observable<MessageEvent> {
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });

      if (payload.role !== 'admin') {
        throw new UnauthorizedException('Admin access required');
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      this.logger.warn('Invalid SSE token attempt');
      throw new UnauthorizedException('Invalid or expired token');
    }

    return this.notificationsService.getNotificationStream();
  }
}
