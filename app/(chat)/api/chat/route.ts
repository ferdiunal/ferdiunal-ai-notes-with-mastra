import type { MessageListInput } from "@mastra/core/agent/message-list";
import { createUIMessageStream, JsonToSseTransformStream, type UIMessage } from "ai";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { uuidv7 } from "uuidv7";
import { generateTitleFromUserMessage, instructionsPrompt, systemPrompt } from "@/lib/ai/prompts";
import { convertToUIMessages } from "@/lib/ai/utils";
import { ChatSDKError } from "@/lib/errors";
import { mastra } from "@/lib/mastra";
import ChatService from "@/services/chat";
import type { AppUsage } from "@/types/useage";
import { schema } from "./schema";

// Allow streaming responses up to 30 seconds
export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.log(parsed.error.issues);
    throw new ChatSDKError("bad_request:chat", parsed.error.message);
  }
  const { message, id } = parsed.data;

  const chat = await ChatService.findById(id);

  try {

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: message as UIMessage });
    await ChatService.create({
      id,
      title,
      visibility: "public",
    });
  }

  const messagesFromDb = await ChatService.messages(id);

  const uiMessages = [...convertToUIMessages(messagesFromDb), message] as MessageListInput;

  if(!await ChatService.existsMessage(message.id)) {
    await ChatService.saveMessage({
      chatId: id,
      id: message.id,
      role: message.role,
      parts: message.parts,
      attachments: [],
    });
  }

  const chatStream = await ChatService.createStream(id);

  let finalMergedUsage: AppUsage | undefined;
 
  const ragAgent = mastra.getAgent("rag");
      
  const stream = createUIMessageStream({
    generateId: uuidv7,
    onError: () => {
      return 'Oops, an error occurred!';
    },
    execute: async ({ writer: dataStream }) => {
        const result = await ragAgent.streamVNext(uiMessages, { 
          format: "aisdk",
          system: systemPrompt(),
          instructions: instructionsPrompt(),
        });

        await result.consumeStream()

        const fullOutput = await result.getFullOutput();

        finalMergedUsage = fullOutput.usage as AppUsage;

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        )
    },
    onFinish: async ({ messages}) => {
      for await (const message of messages) {
        await ChatService.saveMessage({
          chatId: id,
          id: message.id,
          role: message.role,
          parts: message.parts,
          attachments: [],
        });
      }

      if(finalMergedUsage) {
        await ChatService.updateLastContext(id, finalMergedUsage);
      }
    }
  })

  const streamContext = getStreamContext();

  if (streamContext) {
    return new Response(
      await streamContext.resumableStream(chatStream.id, () =>
        stream.pipeThrough(new JsonToSseTransformStream()),
      ),
    );
  } else {
    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error('Unhandled error in chat API:', error);
    return new ChatSDKError('offline:chat').toResponse();
  }
}
