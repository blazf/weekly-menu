import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full border bg-[var(--color-panel)] px-3 py-1 text-sm text-[var(--color-fg)]",
        "border-[var(--color-line-hot)] placeholder:text-[var(--color-fg-faint)]",
        "focus:border-[var(--color-green)] focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
