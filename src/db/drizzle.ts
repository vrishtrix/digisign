import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres(process.env.POSTGRES_URL ?? '');

const db = drizzle(queryClient);

export default db;
