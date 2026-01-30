import PocketBase from "pocketbase";
export { PocketBase };
export type { RecordModel, RecordSubscription } from "pocketbase";
import "dotenv/config";

export const userPb = new PocketBase(process.env.TEST_DB_URL);

// no difference between userPb and superuserPb - just enforces naming convention consistency
export const superuserPb = new PocketBase(process.env.TEST_DB_URL);
