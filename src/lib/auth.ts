// Simple auth context for prototype
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
}

export function getStoredUser(): AuthUser | null {
  const stored = sessionStorage.getItem("auth_user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser) {
  sessionStorage.setItem("auth_user", JSON.stringify(user));
}

export function clearUser() {
  sessionStorage.removeItem("auth_user");
  sessionStorage.removeItem("role_data");
}

export function storeRoleData(data: any) {
  sessionStorage.setItem("role_data", JSON.stringify(data));
}

export function getRoleData(): any {
  const stored = sessionStorage.getItem("role_data");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
