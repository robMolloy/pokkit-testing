import z from "zod";
import "dotenv/config";

const envSchema = z.object({
  TEST_DB_URL: z.string(),
});

const parsedEnvResp = envSchema.safeParse(process.env);

if (!parsedEnvResp.success)
  console.error("Environment variables validation error:", parsedEnvResp.error);

export const parsedEnv = parsedEnvResp.success ? parsedEnvResp.data : null;
