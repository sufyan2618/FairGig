import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../common/Icon";
import { LabeledTextField } from "../common/LabeledTextField";
import { useAuthApi } from "../../hooks/api/useAuthApi";

interface TopHeaderProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

export const TopHeader = ({ searchQuery, onSearchQueryChange }: TopHeaderProps) => (
  <TopHeaderContent searchQuery={searchQuery} onSearchQueryChange={onSearchQueryChange} />
);

const TopHeaderContent = ({ searchQuery, onSearchQueryChange }: TopHeaderProps) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout, isLoading } = useAuthApi();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (isLoggingOut || isLoading) {
      return;
    }

    setIsLoggingOut(true);

    void (async () => {
      await logout();

      navigate("/login", {
        replace: true,
        state: {
          toast: {
            message: "Signed out successfully.",
            tone: "success",
          },
        },
      });
    })();
  };

  return (
    <header className="animate-fade-in relative z-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#f5f6f8]/95 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1d]">Dashboard</h1>
      </div>

      <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
        <div className="w-full min-w-55 sm:w-70">
          <LabeledTextField
            value={searchQuery}
            onChange={onSearchQueryChange}
            placeholder="Search for something"
            leadingAdornment={<Icon name="search" className="h-4 w-4" />}
            aria-label="Search for something"
          />
        </div>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full border border-[#d9dde4] bg-white text-[#5e6677] transition-colors hover:text-[#1d1d1d]"
          aria-label="Notifications"
        >
          <Icon name="bell" className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut || isLoading}
          className="rounded-xl border border-[#d9dde4] bg-white px-3.5 py-2 text-sm font-medium text-[#4a5568] transition-colors hover:bg-[#f1f3f6] hover:text-[#1d1d1d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut || isLoading ? "Signing out..." : "Logout"}
        </button>

        <div className="h-11 w-11 overflow-hidden rounded-full border border-[#d9dde4] bg-linear-to-br from-[#dfe8f9] to-[#f6ddd0]">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
            alt="User"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};
