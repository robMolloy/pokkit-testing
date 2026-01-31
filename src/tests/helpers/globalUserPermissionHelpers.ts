export const createGlobalUserPermissionRecordSeedData = (p?: {
  role?: "standard" | "admin";
  status?: "approved" | "pending" | "rejected";
}) => ({ role: p?.role ?? "standard", status: p?.status ?? "approved" });
