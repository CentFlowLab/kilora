"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface ChoiceGroupProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
  columns?: 2 | 3;
}

/** Botões de escolha única com rádios nativos: funcionam com teclado e leitor de ecrã. */
export function ChoiceGroup<T extends string>({ label, options, value, onChange, error, columns = 2 }: ChoiceGroupProps<T>) {
  const name = useId();
  const errorId = `${name}-error`;

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-ink">{label}</legend>
      <div className={cn("grid gap-2", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center rounded-[12px] border bg-surface px-3 text-center text-sm font-medium transition-colors",
              "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
              value === option.value ? "border-accent bg-accent-soft text-ink" : "border-border text-ink hover:bg-surface-2",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
