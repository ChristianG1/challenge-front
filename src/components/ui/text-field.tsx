import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TextFieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: string;
  error?: string | null;
  hint?: ReactNode;
  adornment?: ReactNode;
}

export function TextField({ label, error, hint, adornment, className, ...props }: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-700">
        {label}
      </label>
      <div
        className={cn(
          "flex h-12 items-center gap-2 rounded-2xl bg-white px-4 ring-1 transition-shadow focus-within:ring-2",
          error ? "ring-red-500 focus-within:ring-red-500" : "ring-ink-200 focus-within:ring-ink-900",
        )}
      >
        {adornment && <span className="text-ink-500">{adornment}</span>}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn("h-full w-full bg-transparent text-base text-ink-900 outline-none placeholder:text-ink-400", className)}
          {...props}
        />
      </div>
      {message && (
        <p id={messageId} role={error ? "alert" : undefined} className={cn("text-sm", error ? "text-red-600" : "text-ink-500")}>
          {message}
        </p>
      )}
    </div>
  );
}
