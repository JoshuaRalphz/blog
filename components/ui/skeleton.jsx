import { cn } from "@/lib/utils"

function Skeleton({
  className,
  variant = "default", // "default", "card", "text", "circle"
  width = "100%",
  height = "1rem",
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-primary/10 animate-pulse rounded-md",
        {
          "rounded-lg": variant === "card",
          "rounded-full": variant === "circle",
          "h-4": variant === "text",
        },
        className
      )}
      style={{
        width,
        height,
      }}
      {...props}
    />
  );
}

function SkeletonGroup({ children, className, ...props }) {
  return (
    <div
      className={cn("space-y-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Skeleton, SkeletonGroup }
