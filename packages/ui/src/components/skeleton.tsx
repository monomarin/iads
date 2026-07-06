import { cn } from "../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-gradient-to-r from-muted via-muted/80 to-muted bg-[length:200%_100%]",
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
