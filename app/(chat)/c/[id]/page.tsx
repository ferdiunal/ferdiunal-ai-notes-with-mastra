import Chat from "@/app/chat";
import { convertToUIMessages } from "@/lib/ai/utils";
import ChatService from "@/services/chat";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chat = await ChatService.findById(id);
  return {
    title: chat?.title || "Chat",
  };
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chat = await ChatService.findById(id);

  if (!chat) {
    return notFound();
  }

  const messagesFromDb = await ChatService.messages(id);

  const uiMessages = convertToUIMessages(messagesFromDb);
  
  return (
    <Chat id={id} initialMessages={uiMessages} autoResume={true} />
  );
}
