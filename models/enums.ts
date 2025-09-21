import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

export const chatVisibility = pgEnum("chat_visibility", ["public", "private"]);
export const chatRole = pgEnum("chat_role", ["system", "user", "assistant"]);

export const ChatRoleSchema = z.enum(chatRole.enumValues);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

export const ChatVisibilitySchema = z.enum(chatVisibility.enumValues);
export type ChatVisibility = z.infer<typeof ChatVisibilitySchema>;