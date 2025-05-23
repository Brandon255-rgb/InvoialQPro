import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create a PostgreSQL client using the Supabase connection string
const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Configure the PostgreSQL client
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 30, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
});

// Create and export the Drizzle ORM instance with our schema
export const db = drizzle(client, { schema });

// Export the schema for use in other files
export { schema }; 