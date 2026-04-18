import type { SelectHTMLAttributes } from "react";
import type { SelectOption } from "../../types/dashboard";
import { classNames } from "../../utils/functions";

interface LabeledSelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
}

export const LabeledSelectField = ({
  label,
  options,
  value,
  onChange,
  containerClassName,
  className,
  id,
  ...rest
}: LabeledSelectFieldProps) => {
  const resolvedId = id ?? label?.toLowerCase().replace(/\s+/g, "-") ?? "select-field";

  return (
    <label htmlFor={resolvedId} className={classNames("flex w-full flex-col gap-1", containerClassName)}>
      {label ? <span className="text-xs font-medium text-[#5f6673]">{label}</span> : null}
      <span className="relative">
        <select
          id={resolvedId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={classNames(
            "h-11 w-full appearance-none rounded-xl border border-[#d9dde4] bg-white px-3 pr-8 text-sm text-[#1d1d1d] outline-none",
            className,
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#8b94a6]">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
            <path d="m5.5 7.5 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </span>
    </label>
  );
};
