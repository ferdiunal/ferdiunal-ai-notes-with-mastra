import { desc, eq, gt, lt, SQL } from "drizzle-orm";
import { db } from "@/lib/database";
import { ChatSDKError } from "@/lib/errors";
import {
  type ChatCreate,
  ChatCreateInput,
  type ChatSelect,
  chat,
  type MessageCreate,
  MessageCreateInput,
  type MessageSelect,
  message,
  type StreamSelect,
  stream,
} from "@/models";
import type { AppUsage } from "@/types/useage";

const findById = async (chatId: string): Promise<ChatSelect | undefined> => {
  const _chat = await db.query.chat.findFirst({
    where: ({id}, { eq }) => eq(id, chatId),
  });
  return _chat;
};

export const create = async (data: ChatCreate): Promise<ChatSelect> => {
  const validate = ChatCreateInput.safeParse(data);
  if (!validate.success) {
    throw new ChatSDKError("bad_request:chat", validate.error.message);
  }
  const _chat = await db
    .insert(chat)
    .values({
      id: validate.data.id,
      title: validate.data.title,
      visibility: validate.data.visibility,
    })
    .returning();

  return _chat[0];
};

export const messages = async (chatId: string): Promise<MessageSelect[]> => {
  const _chat = await findById(chatId);
  if (!_chat) {
    throw new ChatSDKError("not_found:chat", "Chat not found");
  }
  const _messages = await db.query.message.findMany({
    where: eq(message.chatId, chatId),
  });

  return _messages as MessageSelect[];
};

export const lastMessage = async (chatId: string): Promise<MessageSelect | undefined> => {
  const _message = await db.query.message.findFirst({
    where: eq(message.chatId, chatId),
    orderBy: desc(message.createdAt),
  });
  return _message as MessageSelect | undefined;
};

export const existsMessage = async (messageId: string): Promise<boolean> => {
  const _message = await db.$count(message, eq(message.id, messageId));
  return _message > 0;
};

export const saveMessage = async (
  data: MessageCreate
): Promise<MessageSelect> => {
  const validate = MessageCreateInput.safeParse(data);
  if (!validate.success) {
    throw new ChatSDKError("bad_request:database", validate.error.message);
  }
  const _message = await db.insert(message).values(validate.data);
  return _message[0];
};

export const createStream = async (chatId: string): Promise<StreamSelect> => {
  const _stream = await db.insert(stream).values({
    chatId,
  }).returning();
  return _stream[0];
};

export const updateLastContext = async (
  chatId: string,
  lastContext: AppUsage
): Promise<void> => {
  await db
    .update(chat)
    .set({
      lastContext,
    })
    .where(eq(chat.id, chatId));
};

export const streams = async (chatId: string): Promise<StreamSelect[]> => {
  const _streams = await db.query.stream.findMany({
    where: eq(stream.chatId, chatId),
  });
  return _streams;
};

export const lastStream = async (chatId: string): Promise<StreamSelect | undefined> => {
  const _stream = await db.query.stream.findFirst({
    where: eq(stream.chatId, chatId),
    orderBy: desc(stream.createdAt),
  });
  return _stream;
};


export async function getHistories({
  limit,
  startingAfter,
  endingBefore,
}: {
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<ChatSelect> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get history',
    );
  }
}


export default {
  findById,
  create,
  messages,
  lastMessage,
  existsMessage,
  saveMessage,
  createStream,
  updateLastContext,
  streams,
  lastStream,
  getHistories
};
