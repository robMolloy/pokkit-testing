import z from "zod";
import "dotenv/config";

const envSchema = z.object({
  TEST_DB_URL: z.string(),
  TEST_SEED_FILE_NAME: z.string(),
  TEST_DB_USERNAME: z.string(),
  TEST_DB_PASSWORD: z.string(),
});

const parsedEnvResp = envSchema.safeParse(process.env);

if (!parsedEnvResp.success) {
  console.error("Environment variables validation error:", parsedEnvResp.error);
  throw new Error("Invalid environment variables");
}
export const parsedEnv = parsedEnvResp.data;
