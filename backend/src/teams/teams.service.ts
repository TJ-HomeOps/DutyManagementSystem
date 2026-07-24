import { Injectable } from '@nestjs/common';
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
    return this.prisma.team.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateTeamDto) {
    return this.prisma.team.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.team.delete({
      where: { id },
    });
  }
}
