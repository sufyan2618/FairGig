import type { SidebarItem, SidebarItemId } from "../../types/dashboard";
import { classNames } from "../../utils/functions";
import { Icon } from "../common/Icon";
import logo from "../../assets/logo.jpeg";
import { useState } from "react";

interface SidebarProps {
  items: SidebarItem[];
  activeItemId: SidebarItemId;
  onItemSelect: (itemId: SidebarItemId) => void;
}

export const Sidebar = ({ items, activeItemId, onItemSelect }: SidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleItemSelect = (itemId: SidebarItemId) => {
    onItemSelect(itemId);
    setIsMobileOpen(false);
  };

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#232429] px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-[#141518] to-[#2f3239] ring-1 ring-white/10">
            <img src={logo} alt="FairGig logo" className="h-full w-full object-cover scale-110" />
          </div>
          <p className="text-sm font-semibold">FairGig</p>
        </div>

        <button
          type="button"
          aria-label={isMobileOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isMobileOpen}
          onClick={() => setIsMobileOpen((current) => !current)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          {isMobileOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      <button
        type="button"
        tabIndex={isMobileOpen ? 0 : -1}
        aria-hidden={!isMobileOpen}
        aria-label="Close sidebar overlay"
        onClick={() => setIsMobileOpen(false)}
        className={classNames(
          "fixed inset-0 z-40 bg-[#0f1115]/50 transition-opacity lg:hidden",
          isMobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[86vw] bg-[#232429] text-white shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:w-72 lg:max-w-none lg:translate-x-0 lg:shadow-none lg:min-h-screen",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-[#141518] to-[#2f3239] ring-1 ring-white/10">
            <img src={logo} alt="FairGig logo" className="h-full w-full object-cover scale-110" />
          </div>
          <div>
            <p className="text-sm font-semibold">FairGig</p>
            <p className="text-xs text-white/60">Worker Console</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-4 py-4">
          {items.map((item) => {
            const isActive = item.id === activeItemId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemSelect(item.id)}
                className={classNames(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-(--color-button) text-white shadow-[0_8px_20px_rgba(255,145,77,0.3)]"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon name={item.icon} className={classNames("h-4 w-4", isActive ? "text-white" : "text-white/70")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
