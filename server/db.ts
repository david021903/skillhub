import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";

const client = postgres(process.env.PROD_DATABASE_URL || process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
