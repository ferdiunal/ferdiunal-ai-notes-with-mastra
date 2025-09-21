"server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as tables from "../models";


const log = console;

const client = postgres(env.DATABASE_URL, {
    ssl: false,
    // ssl: keys().NODE_ENV === 'production' ? 'require' : false, // SSL for production
    max: 5, // Reduced pool size to prevent "too many clients" error
    idle_timeout: 10, // Close idle connections after 10 seconds (reduced)
    max_lifetime: 60 * 30, // 30 minutes (reduced from 1 hour)
    connect_timeout: 10, // Connection timeout in seconds (reduced)
    prepare: false, // Disable prepared statements to reduce server load
    debug: env.NODE_ENV === 'development',
});

export const database = drizzle(client, {
    schema: { ...tables },
    logger: {
        logQuery: (_query: string, _params: unknown[]) => {
            log.info(_query, { _params });
        },
    },
});

// Alias for backward compatibility
export const db = database;
