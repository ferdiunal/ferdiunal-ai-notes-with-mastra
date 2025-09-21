import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";
import type { AppUsage } from "@/types/useage";
import { id, timestampTz } from "./defaults";
import { chatRole, chatVisibility } from "./enums";

export const chat = pgTable("chats", {
  id: id(),
  title: text("title").notNull(),
  visibility: chatVisibility("visibility").notNull().default("public"),
  lastContext: jsonb('lastContext').$type<AppUsage | null>(),
  createdAt: timestampTz("created_at"),
  updatedAt: timestampTz("updated_at"),
});


export const stream = pgTable('streams', {
  id: id(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
  createdAt: timestampTz('createdAt'),
});


export const message = pgTable('messages', {
    id: id(),
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    role: chatRole('role').notNull(),
    parts: jsonb('parts').notNull(),
    attachments: jsonb('attachments').notNull(),
    createdAt: timestampTz('createdAt'),
  });


export const chatRelations = relations(chat, ({ many }) => ({
  messages: many(message),
  streams: many(stream),
}));


export const StreamCreateInput = createInsertSchema(stream).omit({ id: true, createdAt: true });
export const StreamSelectInput = createSelectSchema(stream);
export const StreamUpdateInput = createUpdateSchema(stream).omit({ createdAt: true, id: true });


export type StreamCreate = z.infer<typeof StreamCreateInput>; 
export type StreamSelect = z.infer<typeof StreamSelectInput>;
export type StreamUpdate = z.infer<typeof StreamUpdateInput>;

export const ChatCreateInput = createInsertSchema(chat).omit({ createdAt: true, updatedAt: true });
export const ChatSelectInput = createSelectSchema(chat);
export const ChatUpdateInput = createUpdateSchema(chat).omit({ createdAt: true, updatedAt: true, id: true });



export type ChatCreate = z.infer<typeof ChatCreateInput>;
export type ChatSelect = z.infer<typeof ChatSelectInput>;
export type ChatUpdate = z.infer<typeof ChatUpdateInput>;

export const MessageCreateInput = createInsertSchema(message).omit({ createdAt: true });
export const MessageSelectInput = createSelectSchema(message);
export const MessageUpdateInput = createUpdateSchema(message).omit({ createdAt: true, id: true });


export const MessageMetadataSchema = MessageSelectInput.extend({}).pick({
  createdAt: true,
})

export type MessageCreate = z.infer<typeof MessageCreateInput>;
export type MessageSelect = z.infer<typeof MessageSelectInput>;
export type MessageUpdate = z.infer<typeof MessageUpdateInput>;
export type MessageMetadata = z.infer<typeof MessageMetadataSchema>;