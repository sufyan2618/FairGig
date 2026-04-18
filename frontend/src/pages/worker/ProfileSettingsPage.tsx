import { useState, type FormEvent } from "react";
import { Button } from "../../components/common/Button";
import { LabeledSelectField } from "../../components/common/LabeledSelectField";
import { LabeledTextField } from "../../components/common/LabeledTextField";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import { sidebarItems } from "../../data/dashboardData";
import { useSidebarNavigation } from "../../hooks/useSidebarNavigation";
import { classNames } from "../../utils/functions";

const cityOptions = [
  { label: "Select city", value: "" },
  { label: "Karachi", value: "Karachi" },
  { label: "Lahore", value: "Lahore" },
  { label: "Islamabad", value: "Islamabad" },
  { label: "Rawalpindi", value: "Rawalpindi" },
  { label: "Peshawar", value: "Peshawar" },
  { label: "Quetta", value: "Quetta" },
  { label: "Other", value: "Other" },
];

const platformCategoryOptions = [
  { label: "Select primary category", value: "" },
  { label: "Food Delivery", value: "Food Delivery" },
  { label: "Ride Hailing", value: "Ride Hailing" },
  { label: "Courier / Parcel", value: "Courier / Parcel" },
  { label: "Grocery Delivery", value: "Grocery Delivery" },
  { label: "Multi-Platform", value: "Multi-Platform" },
];

interface NotificationPrefs {
  appNotifications: boolean;
  smsAlerts: boolean;
  payoutUpdates: boolean;
  grievanceUpdates: boolean;
}

const ProfileSettingsPage = () => {
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation();
  const [searchQuery, setSearchQuery] = useState("");

  const [name, setName] = useState("Ali Raza");
  const [city, setCity] = useState("Karachi");
  const [primaryCategory, setPrimaryCategory] = useState("Ride Hailing");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    appNotifications: true,
    smsAlerts: false,
    payoutUpdates: true,
    grievanceUpdates: true,
  });

  const [notice, setNotice] = useState("");

  const updateNotification = (key: keyof NotificationPrefs) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAccountSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !city || !primaryCategory) {
      setNotice("Please complete all account details before saving.");
      return;
    }

    setNotice("Account details saved successfully.");
  };

  const handlePasswordUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setNotice("Please fill all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setNotice("New password should be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice("New password and confirm password do not match.");
      return;
    }

    setNotice("Password updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleNotificationSave = () => {
    setNotice("Notification preferences updated.");
  };

  const ToggleSwitch = ({
    label,
    description,
    checked,
    onToggle,
  }: {
    label: string;
    description: string;
    checked: boolean;
    onToggle: () => void;
  }) => (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-3 sm:items-center sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#1d1d1d]">{label}</p>
        <p className="mt-0.5 text-xs text-[#667085]">{description}</p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={classNames(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center overflow-hidden rounded-full p-0.5 transition-colors sm:mt-0",
          checked ? "bg-[#1f2024]" : "bg-[#d3d7df]",
        )}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={classNames(
            "h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#eceef2] text-[#1d1d1d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar
          items={sidebarItems}
          activeItemId={activeSidebarItem}
          onItemSelect={onSidebarItemSelect}
        />

        <main className="relative flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-(--color-button)/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#4a5d7d]/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
            <TopHeader searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold text-[#1d1d1d]">My Profile / Settings</h2>
                <p className="mt-1 text-sm text-[#667085]">
                  Manage your account details, password, and notification preferences.
                </p>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <form onSubmit={handleAccountSave} className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                  <h3 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Account Details</h3>

                  <div className="grid gap-3">
                    <LabeledTextField
                      label="Full Name"
                      value={name}
                      onChange={setName}
                      placeholder="Enter your full name"
                      required
                    />
                    <LabeledSelectField
                      label="City"
                      options={cityOptions}
                      value={city}
                      onChange={setCity}
                      required
                    />
                    <LabeledSelectField
                      label="Primary Platform Category"
                      options={platformCategoryOptions}
                      value={primaryCategory}
                      onChange={setPrimaryCategory}
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <Button type="submit">Save Account Details</Button>
                  </div>
                </form>

                <form onSubmit={handlePasswordUpdate} className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                  <h3 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Change Password</h3>

                  <div className="grid gap-3">
                    <LabeledTextField
                      label="Current Password"
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      type="password"
                      placeholder="Current password"
                      required
                    />
                    <LabeledTextField
                      label="New Password"
                      value={newPassword}
                      onChange={setNewPassword}
                      type="password"
                      placeholder="At least 8 characters"
                      required
                    />
                    <LabeledTextField
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      type="password"
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <Button type="submit">Update Password</Button>
                  </div>
                </form>
              </div>

              <div className="mt-5 rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                <h3 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Notification Preferences</h3>

                <div className="grid gap-3">
                  <ToggleSwitch
                    label="App Notifications"
                    description="Receive important updates inside the app"
                    checked={notificationPrefs.appNotifications}
                    onToggle={() => updateNotification("appNotifications")}
                  />
                  <ToggleSwitch
                    label="SMS Alerts"
                    description="Get urgent account and security alerts via SMS"
                    checked={notificationPrefs.smsAlerts}
                    onToggle={() => updateNotification("smsAlerts")}
                  />
                  <ToggleSwitch
                    label="Payout Updates"
                    description="Be notified when weekly payouts are processed"
                    checked={notificationPrefs.payoutUpdates}
                    onToggle={() => updateNotification("payoutUpdates")}
                  />
                  <ToggleSwitch
                    label="Grievance Updates"
                    description="Get status updates for your grievance posts"
                    checked={notificationPrefs.grievanceUpdates}
                    onToggle={() => updateNotification("grievanceUpdates")}
                  />
                </div>

                <div className="mt-4">
                  <Button type="button" onClick={handleNotificationSave}>
                    Save Preferences
                  </Button>
                </div>
              </div>

              {notice ? (
                <p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
                  {notice}
                </p>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
