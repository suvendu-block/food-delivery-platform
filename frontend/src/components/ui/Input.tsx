import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export function Input({
  label,
  error,
  hint,
  icon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-text",
            "placeholder:text-text-light",
            "transition-all duration-200",
            "focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-50",
            icon && "pl-11",
            error
              ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
              : "border-border input-focus",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
