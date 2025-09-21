import { sql } from "drizzle-orm";
import { timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

export const id = () =>
  uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7());
export const timestampTz = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date", precision: 3 })
    .notNull()
    .default(sql`now()`);
