import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async getAssignments(
    start: Date,
    end: Date,
  ) {
    return this.prisma.dutyAssignment.findMany({
      where: {
        AND: [
          {
            start: {
              lte: end,
            },
          },
          {
            end: {
              gte: start,
            },
          },
        ],
      },
      include: {
        employee: {
          include: {
            team: true,
          },
        },
        team: true,
      },
      orderBy: [
        {
          start: 'asc',
        },
        {
          end: 'asc',
        },
      ],
    });
  }

  async createAssignment(data: {
    teamId: string;
    employeeId: string;
    start: Date;
    end: Date;
    notes?: string;
  }) {
    return this.prisma.dutyAssignment.create({
      data: {
        teamId: data.teamId,
        employeeId: data.employeeId,
        start: data.start,
        end: data.end,
        notes: data.notes,
      },
      include: {
        employee: {
          include: {
            team: true,
          },
        },
        team: true,
      },
    });
  }

  async updateAssignment(
    id: string,
    data: {
      teamId?: string;
      employeeId?: string;
      start?: Date;
      end?: Date;
      notes?: string;
    },
  ) {
    const assignment =
      await this.prisma.dutyAssignment.findUnique({
        where: {
          id,
        },
      });

    if (!assignment) {
      throw new NotFoundException(
        'Duty assignment not found',
      );
    }

    return this.prisma.dutyAssignment.update({
      where: {
        id,
      },
      data: {
        ...data,
      },
      include: {
        employee: {
          include: {
            team: true,
          },
        },
        team: true,
      },
    });
  }

  async deleteAssignment(id: string) {
    const assignment =
      await this.prisma.dutyAssignment.findUnique({
        where: {
          id,
        },
      });

    if (!assignment) {
      throw new NotFoundException(
        'Duty assignment not found',
      );
    }

    await this.prisma.dutyAssignment.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
    };
  }

  async getAssignment(id: string) {
    const assignment =
      await this.prisma.dutyAssignment.findUnique({
        where: {
          id,
        },
        include: {
          employee: {
            include: {
              team: true,
            },
          },
          team: true,
        },
      });

    if (!assignment) {
      throw new NotFoundException(
        'Duty assignment not found',
      );
    }

    return assignment;
  }
}
