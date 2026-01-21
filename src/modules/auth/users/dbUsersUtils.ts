import { z } from "zod";
import type { PocketBase, RecordModel, RecordSubscription } from "../pocketbaseTypeHelpers";

const collectionName = "users";

export const userSchema = z.object({
  collectionId: z.string(),
  collectionName: z.literal(collectionName),
  id: z.string(),
  email: z.string(),
  name: z.string(),
  status: z.enum(["pending", "approved", "blocked"]),
  role: z.enum(["standard", "admin"]),
  emailVisibility: z.boolean(),
  verified: z.boolean(),
  created: z.string(),
  updated: z.string(),
});
export type TUser = z.infer<typeof userSchema>;

export const listUsers = async (p: { pb: PocketBase }) => {
  try {
    const initData = await p.pb.collection(collectionName).getFullList();

    const data = initData
      .map((x) => userSchema.safeParse(x))
      .filter((x) => x.success)
      .map((x) => x.data);
    return { success: true, data } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const subscribeToUsers = async (p: {
  pb: PocketBase;
  onCreateUser: (e: RecordSubscription<RecordModel>) => void;
  onUpdateUser: (e: RecordSubscription<RecordModel>) => void;
}) => {
  p.pb.collection(collectionName).subscribe("*", (e) => {
    if (e.action) p.onCreateUser(e);
  });
  return { success: true } as const;
};

export const getUser = async (p: { pb: PocketBase; id: string }) => {
  try {
    const userResp = await p.pb.collection(collectionName).getOne(p.id);
    return userSchema.safeParse(userResp);
  } catch (e) {
    const error = e as { message: string };
    return { success: false, error } as const;
  }
};
export const subscribeToUser = async (p: {
  pb: PocketBase;
  id: string;
  onChange: (e: TUser | null) => void;
}) => {
  try {
    const unsubPromise = p.pb.collection(collectionName).subscribe(p.id, (e) => {
      const parseResp = userSchema.safeParse(e.record);
      p.onChange(parseResp.success ? parseResp.data : null);
    });
    const userRespPromise = getUser(p);

    // subscription must be complete to avoid any race conditions issues
    // avoid using promises.all to be explicit
    const unsub = await unsubPromise;
    const userResp = await userRespPromise;

    p.onChange(userResp.success ? userResp.data : null);

    return { success: true, data: unsub } as const;
  } catch (error) {
    p.onChange(null);
    return { success: false, error } as const;
  }
};

export const smartSubscribeToUsers = async (p: {
  pb: PocketBase;
  onChange: (x: TUser[]) => void;
}) => {
  const listUsersResp = await listUsers(p);
  if (!listUsersResp.success) return listUsersResp;

  let allDocs = listUsersResp.data;
  p.onChange(allDocs);
  const unsub = p.pb.collection(collectionName).subscribe("*", (e) => {
    if (e.action === "create") {
      const parseResp = userSchema.safeParse(e.record);
      if (parseResp.success) allDocs.push(parseResp.data);
    }
    if (e.action === "update") {
      const parseResp = userSchema.safeParse(e.record);
      if (!parseResp.success) return;

      allDocs = allDocs.filter((x) => parseResp.data?.id !== x.id);
      allDocs.push(parseResp.data);
    }
    if (e.action === "delete") {
      const parseResp = userSchema.safeParse(e.record);
      if (!parseResp.success) return;

      allDocs = allDocs.filter((x) => parseResp.data?.id !== x.id);
    }
    p.onChange(allDocs);
  });

  return { success: true, data: unsub } as const;
};

export const updateUserStatus = async (p: {
  pb: PocketBase;
  id: string;
  status: TUser["status"];
}) => {
  try {
    const resp = await p.pb.collection(collectionName).update(p.id, { status: p.status });
    return { success: true, data: resp } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const updateUserRole = async (p: { pb: PocketBase; id: string; role: TUser["role"] }) => {
  try {
    const resp = await p.pb.collection(collectionName).update(p.id, { role: p.role });
    return { success: true, data: resp } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};

export const deleteUser = async (p: { pb: PocketBase; id: string }) => {
  try {
    await p.pb.collection(collectionName).delete(p.id);
    return { success: true } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};
