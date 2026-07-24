import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.team.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.team.findUnique({
      where: { id },
    });
  }

  async create(dto: CreateTeamDto) {
    try {
      return await this.prisma.team.create({
        data: dto,
      });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async update(id: string, dto: UpdateTeamDto) {
    try {
      return await this.prisma.team.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.team.delete({
        where: { id },
      });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === 'P2002') {
        return new ConflictException(
          'A team with this name already exists.',
        );
      }

      if (error.code === 'P2003') {
        return new ConflictException(
          'This team still has employees, duty rules, or assignments linked to it.',
        );
      }
    }

    return error;
  }
}
