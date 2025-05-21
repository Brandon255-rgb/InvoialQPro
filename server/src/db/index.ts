import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Get database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres client
const client = postgres(databaseUrl);

// Create drizzle database instance
export const db = drizzle(client, { schema });

// Export schema for type inference
export { schema }; 