import { PrismaService } from '../prisma/prisma.service';

// Any DutyAssignment for this employee (in any team) whose date range
// overlaps [start, end] — the same person can't physically cover two
// duties at once, regardless of which team each one belongs to.
export function findOverlappingAssignment(
  prisma: PrismaService,
  params: {
    employeeId: string;
    start: Date;
    end: Date;
    excludeAssignmentId?: string;
  },
) {
  return prisma.dutyAssignment.findFirst({
    where: {
      employeeId: params.employeeId,
      ...(params.excludeAssignmentId && {
        id: { not: params.excludeAssignmentId },
      }),
      start: { lte: params.end },
      end: { gte: params.start },
    },
    include: { team: true },
  });
}
