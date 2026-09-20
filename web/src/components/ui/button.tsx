import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0 border",
  {
    variants: {
      variant: {
        default:
          "border-[var(--color-green)] text-[var(--color-green)] bg-transparent hover:bg-[var(--color-green)] hover:text-[#04120a]",
        muted:
          "border-[var(--color-line-hot)] text-[var(--color-fg-dim)] bg-transparent hover:text-[var(--color-fg)] hover:border-[var(--color-fg-dim)]",
        danger:
          "border-[var(--color-red)] text-[var(--color-red)] bg-transparent hover:bg-[var(--color-red)] hover:text-[#160604]",
        ghost:
          "border-transparent text-[var(--color-fg-dim)] hover:text-[var(--color-fg)]",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-7 px-2.5 text-xs",
        lg: "h-11 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({
  className, variant, size, asChild = false, ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
