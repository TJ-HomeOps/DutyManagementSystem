import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.employee.findMany({
      include: {
        team: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: {
        team: true,
      },
    });
  }

  async create(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    return this.prisma.employee.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.employee.delete({
      where: { id },
    });
  }
}
