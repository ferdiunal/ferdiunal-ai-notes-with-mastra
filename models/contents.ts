"server-only";

import { pgTable, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { nanoid } from "@/lib/utils";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const contents = pgTable("contents", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  contentIndex: index("content_index").on(table.content),
  createdAtIndex: index("created_at_index").on(table.createdAt),
  updatedAtIndex: index("updated_at_index").on(table.updatedAt),
}));

export const insertContentSchema = createInsertSchema(contents)
  .extend({})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });
export type InsertContent = typeof insertContentSchema;

export const selectContentSchema = createSelectSchema(contents);
export type SelectContent = typeof selectContentSchema;
