import { useState, type FormEvent } from "react";
import { Button } from "../../components/common/Button";
import { LabeledSelectField } from "../../components/common/LabeledSelectField";
import { LabeledTextField } from "../../components/common/LabeledTextField";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopHeader } from "../../components/layout/TopHeader";
import { advocateSidebarItems } from "../../data/advocateData";
import { useSidebarNavigation } from "../../hooks/useSidebarNavigation";

const cityOptions = [
  { label: "Select city", value: "" },
  { label: "Karachi", value: "Karachi" },
  { label: "Lahore", value: "Lahore" },
  { label: "Islamabad", value: "Islamabad" },
  { label: "Rawalpindi", value: "Rawalpindi" },
  { label: "Peshawar", value: "Peshawar" },
  { label: "Quetta", value: "Quetta" },
];

const specializationOptions = [
  { label: "Select specialization", value: "" },
  { label: "Platform Policy Advocacy", value: "Platform Policy Advocacy" },
  { label: "Labor Rights Support", value: "Labor Rights Support" },
  { label: "Payment Dispute Handling", value: "Payment Dispute Handling" },
  { label: "Account Recovery Cases", value: "Account Recovery Cases" },
];

const AdvocateProfileSettingsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [fullName, setFullName] = useState("Sara Ahmed");
  const [email, setEmail] = useState("sara.ahmed@fairgig.org");
  const [city, setCity] = useState("Lahore");
  const [specialization, setSpecialization] = useState("Labor Rights Support");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notice, setNotice] = useState("");
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation();

  const handleAccountSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName.trim() || !email.trim() || !city || !specialization) {
      setNotice("Please complete all account fields before saving.");
      return;
    }

    setNotice("Profile settings saved successfully.");
  };

  const handlePasswordChange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setNotice("Please fill all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setNotice("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice("New password and confirm password do not match.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setNotice("Password changed successfully.");
  };

  return (
    <div className="min-h-screen bg-[#eceef2] text-[#1d1d1d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar
          items={advocateSidebarItems}
          activeItemId={activeSidebarItem}
          onItemSelect={onSidebarItemSelect}
        />

        <main className="relative flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-(--color-button)/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#4a5d7d]/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
            <TopHeader searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
              <h2 className="text-2xl font-semibold text-[#1d1d1d]">My Profile / Settings</h2>
              <p className="mt-1 text-sm text-[#667085]">
                Manage your advocate account details and update your password securely.
              </p>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <form onSubmit={handleAccountSave} className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                  <h3 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Basic Account Settings</h3>
                  <div className="grid gap-3">
                    <LabeledTextField
                      label="Full Name"
                      value={fullName}
                      onChange={setFullName}
                      placeholder="Enter full name"
                      required
                    />
                    <LabeledTextField
                      label="Email Address"
                      value={email}
                      onChange={setEmail}
                      type="email"
                      placeholder="name@fairgig.org"
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
                      label="Specialization"
                      options={specializationOptions}
                      value={specialization}
                      onChange={setSpecialization}
                      required
                    />
                  </div>
                  <div className="mt-4">
                    <Button type="submit">Save Account Settings</Button>
                  </div>
                </form>

                <form onSubmit={handlePasswordChange} className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                  <h3 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Password Change</h3>
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

export default AdvocateProfileSettingsPage;
