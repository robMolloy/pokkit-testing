import { useCurrentUserStore } from "../authDataStore";

export const LoadingUser = (p: { children: React.ReactNode }) => {
  const currentUserStore = useCurrentUserStore();
  if (currentUserStore.data.authStatus === "loading") return p.children;
};
