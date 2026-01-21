import { useCurrentUserStore } from "../authDataStore";

export const SignedIn = (p: { children: React.ReactNode }) => {
  const currentUserStore = useCurrentUserStore();
  if (currentUserStore.data.authStatus === "loggedIn" && !currentUserStore.data.user.verified)
    return p.children;
};
