import type { ButtonHTMLAttributes, ReactNode } from "react";
import { classNames } from "../../utils/functions";

type ButtonVariant = "primary" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftAdornment?: ReactNode;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-button)] text-white hover:brightness-95",
  ghost: "bg-white text-[#1d1d1d] border border-[#d8dce3] hover:bg-[#f4f5f7]",
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export const Button = ({
  className,
  children,
  leftAdornment,
  variant = "primary",
  size = "md",
  type = "button",
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={classNames(
      "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-button)/35",
      variantClassMap[variant],
      sizeClassMap[size],
      className,
    )}
    {...rest}
  >
    {leftAdornment}
    {children}
  </button>
);
