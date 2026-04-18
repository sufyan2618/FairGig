import type { IconName } from "../../types/dashboard";
import { classNames } from "../../utils/functions";

interface IconProps {
  name: IconName;
  className?: string;
}

export const Icon = ({ name, className }: IconProps) => {
  const baseClassName = classNames("h-5 w-5", className);

  switch (name) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <path d="M3 12h8V3H3v9Zm0 9h8v-6H3v6Zm10 0h8V12h-8v9Zm0-18v6h8V3h-8Z" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5v5l3 1.8" />
        </svg>
      );
    case "wallet":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <rect x="3" y="6.5" width="18" height="11" rx="2.5" />
          <path d="M3 9.5h18" />
          <circle cx="16.5" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    case "upload":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <path d="M12 15V4" />
          <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
          <path d="M4 16.5v1A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5v-1" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <path d="M4 18h16" />
          <path d="M7 14v-3" />
          <path d="M12 14V8" />
          <path d="M17 14V5" />
        </svg>
      );
    case "certificate":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <path d="M8 3.5h8a2.5 2.5 0 0 1 2.5 2.5v12l-3.5-2-3.5 2-3.5-2-3.5 2V6A2.5 2.5 0 0 1 8 3.5Z" />
          <circle cx="12" cy="9.5" r="2.2" />
        </svg>
      );
    case "message":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <path d="M5.5 5h13A2.5 2.5 0 0 1 21 7.5v7A2.5 2.5 0 0 1 18.5 17H11l-4.5 3v-3H5.5A2.5 2.5 0 0 1 3 14.5v-7A2.5 2.5 0 0 1 5.5 5Z" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <path d="m12 8.2.8-1.6 2 .2.8 1.9 1.7.9 1.6-.8 1.4 1.5-.8 1.6.9 1.7 1.9.8-.2 2-1.9.8-.9 1.7.8 1.6-1.4 1.5-1.6-.8-1.7.9-.8 1.9-2-.2-.8-1.9-1.7-.9-1.6.8-1.5-1.5.8-1.6-.9-1.7-1.9-.8.2-2 1.9-.8.9-1.7-.8-1.6L5.3 8l1.5-1.5 1.6.8 1.7-.9.8-1.9 2 .2Z" />
          <circle cx="12" cy="12" r="2.4" />
        </svg>
      );
    case "bell":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <path d="M12 4.5a5 5 0 0 0-5 5v2.8L5.5 15v1h13v-1L17 12.3V9.5a5 5 0 0 0-5-5Z" />
          <path d="M9.8 18a2.2 2.2 0 0 0 4.4 0" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.3 4.3" />
        </svg>
      );
    case "briefcase":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <rect x="3.5" y="7" width="17" height="11" rx="2.5" />
          <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" />
          <path d="M3.5 11h17" />
        </svg>
      );
    case "team":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <circle cx="9" cy="9" r="2.5" />
          <circle cx="15.5" cy="8.5" r="2" />
          <path d="M4.5 18a4.5 4.5 0 0 1 9 0" />
          <path d="M13 18a3.5 3.5 0 0 1 7 0" />
        </svg>
      );
    case "tool":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={baseClassName}>
          <path d="M7 5h10" />
          <path d="M12 5v14" />
          <path d="M8.5 8.5h7" />
        </svg>
      );
    default:
      return null;
  }
};
