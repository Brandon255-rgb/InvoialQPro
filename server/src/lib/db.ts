import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create a PostgreSQL client using the Supabase connection string
const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Parse the connection string to ensure it's properly formatted
const parsedUrl = new URL(connectionString);
// Update port to 6543 for pgbouncer
parsedUrl.port = '6543';
// Ensure pgbouncer parameter is set
if (!parsedUrl.searchParams.has('pgbouncer')) {
  parsedUrl.searchParams.set('pgbouncer', 'true');
}
const finalConnectionString = parsedUrl.toString();

// Configure the PostgreSQL client
const client = postgres(finalConnectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 30, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  prepare: false, // Disable prepared statements for better compatibility
  transform: {
    undefined: null, // Transform undefined to null
  },
  connection: {
    application_name: 'invoiaiqpro_server', // Identify the connection
    search_path: 'public' // Set the search path to public schema
  }
});

// Create and export the Drizzle ORM instance with our schema
export const db = drizzle(client, { schema });

// Export the schema for use in other files
export { schema }; 