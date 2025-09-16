import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const shellVariants = cva(
  "grid items-center gap-8 pb-8 pt-6 md:py-8",
  {
    variants: {
      size: {
        default: "container",
        sm: "container max-w-3xl",
        md: "container max-w-5xl",
        lg: "container max-w-7xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface ShellProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof shellVariants> {
  asChild?: boolean;
}

function Shell({
  className,
  asChild = false,
  size,
  ...props
}: ShellProps) {
  return (
    <div className={cn(shellVariants({ size }), className)} {...props} />
  );
}

export { Shell };
