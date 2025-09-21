import { createUIMessageStream, JsonToSseTransformStream } from "ai";
import { differenceInSeconds } from "date-fns";
import { ChatSDKError } from "@/lib/errors";
import ChatService from "@/services/chat";
import type { ChatMessage } from "@/types/chat";
import { getStreamContext } from "../../route";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: chatId } = await params;

  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  if (!chatId) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const chat = await ChatService.findById(chatId);

  if (!chat) {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  const lastStream = await ChatService.lastStream(chatId);

  if (!lastStream) {
    return new ChatSDKError('not_found:stream').toResponse();
  }
  
  const emptyDataStream = createUIMessageStream<ChatMessage>({
    execute: () => {},
  });

  const stream = await streamContext.resumableStream(lastStream.id, () =>
    emptyDataStream.pipeThrough(new JsonToSseTransformStream()),
  );


  /*
   * For when the generation is streaming during SSR
   * but the resumable stream has concluded at this point.
   */
  if (!stream) {
    const mostRecentMessage = await ChatService.lastMessage(chatId);

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 });
    }

    if (mostRecentMessage.role !== 'assistant') {
      return new Response(emptyDataStream, { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 });
    }

    const restoredStream = createUIMessageStream<ChatMessage>({
      execute: ({ writer }) => {
        writer.write({
            type: 'data-appendMessage',
            data: JSON.stringify(mostRecentMessage),
            transient: true,
        });
      },
    });

    return new Response(
      restoredStream.pipeThrough(new JsonToSseTransformStream()),
      { status: 200 },
    );
  }


  return new Response(stream, { status: 200 });
}
