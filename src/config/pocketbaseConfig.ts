import PocketBase from "pocketbase";
export { PocketBase };
export type { RecordModel, RecordSubscription } from "pocketbase";

export const userPb = new PocketBase(import.meta.env.VITE_POCKETBASE_TEST_DB_URL);

// no difference between userPb and superuserPb - just enforces naming convention consistency
export const superuserPb = new PocketBase(import.meta.env.VITE_POCKETBASE_TEST_DB_URL);
