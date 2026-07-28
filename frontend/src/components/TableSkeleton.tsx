import { Skeleton, Stack } from "@mui/material";

export default function TableSkeleton({
  rows = 5,
}: {
  rows?: number;
}) {
  return (
    <Stack spacing={1.5} sx={{ py: 1 }}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rounded"
          height={40}
          sx={{ borderRadius: 2 }}
        />
      ))}
    </Stack>
  );
}
