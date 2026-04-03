import {
  Controller,
  Post,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @UseGuards(JwtAuthGuard)
  async clockIn(@Req() req: { user: { id: number; name: string } }) {
    return this.attendanceService.clockIn(req.user.id, req.user.name);
  }

  @Post('clock-out')
  @UseGuards(JwtAuthGuard)
  async clockOut(@Req() req: { user: { id: number; name: string } }) {
    return this.attendanceService.clockOut(req.user.id, req.user.name);
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  async getToday(@Req() req: { user: { id: number } }) {
    return this.attendanceService.getToday(req.user.id);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async getSummary(
    @Req() req: { user: { id: number } },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const defaultTo = now.toISOString().split('T')[0];

    return this.attendanceService.getSummary(
      req.user.id,
      from || defaultFrom,
      to || defaultTo,
    );
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('employee_id') employeeId?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit || '10', 10) || 10));

    return this.attendanceService.findAll({
      page: pageNum,
      limit: limitNum,
      from,
      to,
      employee_id: employeeId ? parseInt(employeeId, 10) : undefined,
    });
  }
}
