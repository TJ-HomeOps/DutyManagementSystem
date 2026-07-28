import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

function rethrowDuplicateEmail(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    (error.meta?.target as string[] | undefined)?.includes('email')
  ) {
    throw new ConflictException(
      'Another employee already uses that email address.',
    );
  }

  throw error;
}

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
    return this.prisma.employee
      .create({
        data: dto,
      })
      .catch(rethrowDuplicateEmail);
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    return this.prisma.employee
      .update({
        where: { id },
        data: dto,
      })
      .catch(rethrowDuplicateEmail);
  }

  async remove(id: string) {
    return this.prisma.employee.delete({
      where: { id },
    });
  }
}
