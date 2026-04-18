import type { InputHTMLAttributes, ReactNode } from "react";
import { classNames } from "../../utils/functions";

interface LabeledTextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  leadingAdornment?: ReactNode;
  containerClassName?: string;
}

export const LabeledTextField = ({
  label,
  value,
  onChange,
  leadingAdornment,
  containerClassName,
  className,
  id,
  ...rest
}: LabeledTextFieldProps) => {
  const resolvedId = id ?? label?.toLowerCase().replace(/\s+/g, "-") ?? "input-field";

  return (
    <label htmlFor={resolvedId} className={classNames("flex w-full flex-col gap-1", containerClassName)}>
      {label ? <span className="text-xs font-medium text-[#5f6673]">{label}</span> : null}
      <span className="flex h-11 items-center rounded-xl border border-[#d9dde4] bg-white px-3">
        {leadingAdornment ? (
          <span className="mr-2 text-[#8b94a6]" aria-hidden>
            {leadingAdornment}
          </span>
        ) : null}
        <input
          id={resolvedId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={classNames(
            "h-full w-full border-none bg-transparent text-sm text-[#1d1d1d] outline-none placeholder:text-[#9aa3b2]",
            className,
          )}
          {...rest}
        />
      </span>
    </label>
  );
};
