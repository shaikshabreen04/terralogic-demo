import { useMemo, useState } from "react";
import { getEffectiveLoginUsername, getPurchaseManagerAccount, isAllowedChefSubRole, validateLoginForm } from "../lib/authUtils";
import type { LoginCredentials, UserRecord } from "../types";

type UseAuthParams = {
  users: UserRecord[];
  onLogin: (credentials: LoginCredentials) => Promise<string | null>;
};

export function useAuth({ users, onLogin }: UseAuthParams) {
  const [loginRole, setLoginRole] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const availableUsers = useMemo(() => {
    if (!loginRole) return [];
    const normalizedRole = loginRole.toLowerCase();
    return users.filter((user) => user.role.toLowerCase() === normalizedRole);
  }, [loginRole, users]);

  const purchaseManagerAccount = useMemo(() => getPurchaseManagerAccount(users), [users]);
  const effectiveUsername = getEffectiveLoginUsername(loginRole, loginUsername, purchaseManagerAccount);
  const canSubmit = Boolean(loginRole && loginPassword && (loginRole.toLowerCase() === "purchase manager" || loginUsername));

  const handleRoleChange = (nextRole: string) => {
    setLoginRole(nextRole);
    setLoginError("");

    if (!nextRole) {
      setLoginUsername("");
      return;
    }

    if (nextRole.toLowerCase() === "purchase manager") {
      setLoginUsername(purchaseManagerAccount?.name ?? "Meena");
      return;
    }

    const filteredUsers = users.filter((user) => user.role.toLowerCase() === nextRole.toLowerCase());
    if (nextRole === "Manager" && filteredUsers.length === 1) {
      setLoginUsername(filteredUsers[0].name);
      return;
    }

    setLoginUsername("");
  };

  const handleUsernameChange = (nextUsername: string) => {
    setLoginUsername(nextUsername);
    setLoginError("");
  };

  const handlePasswordChange = (nextPassword: string) => {
    setLoginPassword(nextPassword);
    setLoginError("");
  };

  const handleSubmit = async () => {
    const validationError = validateLoginForm({ role: loginRole, username: loginUsername, password: loginPassword });
    if (validationError) {
      setLoginError(validationError);
      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      const responseError = await onLogin({ role: loginRole, username: effectiveUsername, password: loginPassword });
      if (responseError) {
        setLoginError(responseError);
        return;
      }

      setLoginRole("");
      setLoginUsername("");
      setLoginPassword("");
    } finally {
      setLoginLoading(false);
    }
  };

  return {
    loginRole,
    loginUsername,
    loginPassword,
    loginError,
    loginLoading,
    availableUsers,
    purchaseManagerAccount,
    effectiveUsername,
    canSubmit,
    handleRoleChange,
    handleUsernameChange,
    handlePasswordChange,
    handleSubmit,
    setLoginError,
  };
}
