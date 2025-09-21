import { defineConfig } from "drizzle-kit";
import { env } from "./env";

export default defineConfig({
    schema: "./models/index.ts",
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: env.DATABASE_URL,
    },
    migrations: {
        table: "migrations",
        schema: "public",
    },

    strict: true,
    verbose: false,
    schemaFilter: ["public"],
    tablesFilter: ["public"],
});
