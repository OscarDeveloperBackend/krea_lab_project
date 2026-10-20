import "dotenv/config";

export const envs = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3100,
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_KEY: process.env.SUPABASE_KEY || "", 
};
