import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Employee } from '../employees/entities/employee.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<Employee> {
    const employee = await this.employeeRepository
      .createQueryBuilder('employee')
      .addSelect('employee.password')
      .where('employee.email = :email', { email })
      .getOne();

    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = employee;
    return result as Employee;
  }

  async login(employee: Employee) {
    const payload = {
      sub: employee.id,
      email: employee.email,
      role: employee.role,
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      employee,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      const employee = await this.employeeRepository.findOne({
        where: { id: payload.sub },
      });

      if (!employee || !employee.is_active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newPayload = {
        sub: employee.id,
        email: employee.email,
        role: employee.role,
      };

      return {
        accessToken: this.jwtService.sign(newPayload, { expiresIn: '15m' }),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
