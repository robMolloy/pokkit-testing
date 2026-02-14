export const createGlobalUserPermissionRecordSeedData = (p?: {
  role?: "standard" | "admin";
  status?: "approved" | "pending" | "rejected";
}) => ({ role: p?.role ?? "standard", status: p?.status ?? "approved" });

export const globalUserPermissionSeedFactory = {
  forCreate: (p: {
    userId: string;
    role: "standard" | "admin";
    status: "approved" | "pending" | "rejected";
  }) => ({
    userId: p.userId,
    role: p.role,
    status: p.status,
  }),
  // forUpdate: () => {},
};