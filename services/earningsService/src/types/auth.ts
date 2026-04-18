export type UserRole = 'worker' | 'verifier' | 'advocate';

export interface AuthUser {
  id: string;
  role: UserRole;
  email?: string;
  name?: string;
}
