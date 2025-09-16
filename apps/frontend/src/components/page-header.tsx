import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import React from "react";

const pageHeaderVariants = cva(
  "flex flex-col gap-1",
  {
    variants: {
      size: {
        default: "py-8",
        sm: "py-4",
        lg: "py-12",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface PageHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageHeaderVariants> {
  asChild?: boolean;
}

function PageHeader({
  className,
  size,
  asChild = false,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn(pageHeaderVariants({ size }), className)} {...props} />
  );
}

const pageHeaderHeadingVariants = cva(
  "text-3xl font-bold tracking-tight",
  {
    variants: {
      size: {
        default: "text-3xl md:text-4xl lg:text-5xl",
        sm: "text-2xl md:text-3xl",
        lg: "text-4xl md:text-5xl lg:text-6xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface PageHeaderHeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof pageHeaderHeadingVariants> {
  asChild?: boolean;
}

function PageHeaderHeading({
  className,
  size,
  asChild = false,
  ...props
}: PageHeaderHeadingProps) {
  return (
    <h1
      className={cn(pageHeaderHeadingVariants({ size }), className)}
      {...props}
    />
  );
}

const pageHeaderDescriptionVariants = cva(
  "text-muted-foreground text-lg",
  {
    variants: {
      size: {
        default: "text-lg",
        sm: "text-base",
        lg: "text-xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface PageHeaderDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof pageHeaderDescriptionVariants> {
  asChild?: boolean;
}

function PageHeaderDescription({
  className,
  size,
  asChild = false,
  ...props
}: PageHeaderDescriptionProps) {
  return (
    <p
      className={cn(pageHeaderDescriptionVariants({ size }), className)}
      {...props}
    />
  );
}

export { PageHeader, PageHeaderHeading, PageHeaderDescription };
