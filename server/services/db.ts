import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

export async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL");
  } catch (err) {
    console.error("❌ Failed to connect to DB:", err);
    process.exit(1);
  }
}