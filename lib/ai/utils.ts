import type { UIMessagePart } from "ai";
import type { MessageSelect } from "@/models";
import type { ChatMessage, CustomUIDataTypes } from "@/types/chat";

export function convertToUIMessages(messages: MessageSelect[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: message.parts as UIMessagePart<CustomUIDataTypes, Record<string, never>>[],
    metadata: {
      createdAt: message.createdAt,
    },
  }));
}