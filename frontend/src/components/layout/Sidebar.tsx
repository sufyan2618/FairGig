import type { SidebarItem, SidebarItemId } from "../../types/dashboard";
import { classNames } from "../../utils/functions";
import { Icon } from "../common/Icon";

interface SidebarProps {
  items: SidebarItem[];
  activeItemId: SidebarItemId;
  onItemSelect: (itemId: SidebarItemId) => void;
}

export const Sidebar = ({ items, activeItemId, onItemSelect }: SidebarProps) => (
  <aside className="w-full bg-[#232429] text-white lg:min-h-screen lg:w-72">
    <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#141518] to-[#2f3239] ring-1 ring-white/10">
        <span className="text-lg font-bold text-[var(--color-button)]">FG</span>
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
            onClick={() => onItemSelect(item.id)}
            className={classNames(
              "group flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-[var(--color-button)] text-white shadow-[0_8px_20px_rgba(255,145,77,0.3)]"
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
);
