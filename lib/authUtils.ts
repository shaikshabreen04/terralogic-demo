import type { LoginCredentials, LoggedInUser, UserRecord } from "../types";

export const normalizeRole = (role: string) => role.trim().toLowerCase();

export const isPurchaseManagerRole = (role: string) => normalizeRole(role) === "purchase manager";

export const isAllowedRole = (role: string) => {
  const normalized = normalizeRole(role);
  return ["chef", "manager", "purchase manager", "store keeper"].includes(normalized);
};

export const isAllowedChefSubRole = (subRole: string) => {
  const normalized = normalizeRole(subRole);
  return ["saucier chef", "poissonnier chef"].includes(normalized);
};

export const getPurchaseManagerAccount = (users: UserRecord[]) => users.find((user) => isPurchaseManagerRole(user.role));

export const getEffectiveLoginUsername = (
  loginRole: string,
  loginUsername: string,
  purchaseManagerAccount?: UserRecord,
) => {
  if (isPurchaseManagerRole(loginRole)) {
    return purchaseManagerAccount?.name ?? "Meena";
  }

  return loginUsername.trim();
};

export const validateLoginForm = ({ role, username, password }: LoginCredentials) => {
  const normalizedRole = normalizeRole(role);

  if (!role || (!username && !isPurchaseManagerRole(normalizedRole)) || !password) {
    return "Please select role, user, and enter password";
  }

  return null;
};

export const findMatchingUser = (
  users: UserRecord[],
  loginRole: string,
  username: string,
  password: string,
) => {
  const normalizedRole = normalizeRole(loginRole);
  const effectiveUsername = username.trim();

  return users.find(
    (user) => normalizeRole(user.role) === normalizedRole && user.name === effectiveUsername && user.password === password,
  );
};

export const buildLoggedInUser = (user: UserRecord): LoggedInUser => ({
  id: user.id,
  name: user.name,
  role: user.role,
  sub_role: user.sub_role,
  property_id: user.property_id,
});
