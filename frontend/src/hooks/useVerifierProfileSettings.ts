import { useState } from "react";
import type { VerifierPasswordPayload, VerifierProfile } from "../types/verifier";

const initialProfile: VerifierProfile = {
	fullName: "Ayesha Khan",
	email: "ayesha.khan@fairgig.app",
	phone: "+92 300 1234567",
	timezone: "Asia/Karachi",
};

const initialPasswordPayload: VerifierPasswordPayload = {
	currentPassword: "",
	newPassword: "",
	confirmPassword: "",
};

interface UseVerifierProfileSettingsResult {
	profile: VerifierProfile;
	passwordPayload: VerifierPasswordPayload;
	updateProfileField: (field: keyof VerifierProfile, value: string) => void;
	updatePasswordField: (field: keyof VerifierPasswordPayload, value: string) => void;
	resetPasswordPayload: () => void;
}

export const useVerifierProfileSettings = (): UseVerifierProfileSettingsResult => {
	const [profile, setProfile] = useState<VerifierProfile>(initialProfile);
	const [passwordPayload, setPasswordPayload] =
		useState<VerifierPasswordPayload>(initialPasswordPayload);

	const updateProfileField = (field: keyof VerifierProfile, value: string) => {
		setProfile((previous) => ({ ...previous, [field]: value }));
	};

	const updatePasswordField = (
		field: keyof VerifierPasswordPayload,
		value: string,
	) => {
		setPasswordPayload((previous) => ({ ...previous, [field]: value }));
	};

	const resetPasswordPayload = () => {
		setPasswordPayload(initialPasswordPayload);
	};

	return {
		profile,
		passwordPayload,
		updateProfileField,
		updatePasswordField,
		resetPasswordPayload,
	};
};
