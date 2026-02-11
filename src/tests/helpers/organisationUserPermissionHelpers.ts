export const createOrganisationUserPermissionRecordCreateSeedData = (p?: {
  role?: "standard" | "admin";
  status?: "approved" | "pending" | "rejected";
}) => ({ role: p?.role ?? "standard", status: p?.status ?? "approved" });

export const organisationUserPermissionSeedFactory = {
  forCreate: (p: {
    userId: string;
    organisationId: string;
    role: "standard" | "admin";
    status: "approved" | "pending" | "rejected";
  }) => ({
    userId: p.userId,
    organisationId: p.organisationId,
    role: p.role,
    status: p.status,
    userOrgKey: `${p.userId}-${p.organisationId}`,
  }),
  // forUpdate: () => {},
};
