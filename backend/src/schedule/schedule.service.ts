import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { findOverlappingAssignment } from '../common/duty-conflicts.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async getAssignments(start: Date, end: Date) {
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
    const overlapping = await findOverlappingAssignment(this.prisma, {
      employeeId: data.employeeId,
      start: data.start,
      end: data.end,
    });

    if (overlapping) {
      throw new ConflictException(
        `This employee already has a duty assignment for ${overlapping.team.name} covering this period.`,
      );
    }

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
    const assignment = await this.prisma.dutyAssignment.findUnique({
      where: {
        id,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Duty assignment not found');
    }

    const overlapping = await findOverlappingAssignment(this.prisma, {
      employeeId: data.employeeId ?? assignment.employeeId,
      start: data.start ?? assignment.start,
      end: data.end ?? assignment.end,
      excludeAssignmentId: id,
    });

    if (overlapping) {
      throw new ConflictException(
        `This employee already has a duty assignment for ${overlapping.team.name} covering this period.`,
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
    const assignment = await this.prisma.dutyAssignment.findUnique({
      where: {
        id,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Duty assignment not found');
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
    const assignment = await this.prisma.dutyAssignment.findUnique({
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
      throw new NotFoundException('Duty assignment not found');
    }

    return assignment;
  }
}
