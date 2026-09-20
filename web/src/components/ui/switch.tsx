"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center border transition-colors",
        "border-[var(--color-line-hot)] bg-[var(--color-panel)]",
        "data-[state=checked]:border-[var(--color-green)] data-[state=checked]:bg-[var(--color-green)]/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-3.5 bg-[var(--color-fg-faint)] transition-transform",
          "data-[state=checked]:translate-x-4 data-[state=checked]:bg-[var(--color-green)]",
          "data-[state=unchecked]:translate-x-0.5"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
