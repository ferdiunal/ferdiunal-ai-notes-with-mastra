"use client";

import { Actions } from "@/components/ai-elements/actions";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { CopyButton } from "@/components/ai-elements/copy-button";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { ChatSDKError } from "@/lib/errors";
import { fetchWithErrorHandlers } from "@/lib/utils";
import { useDataStream } from "@/providers/data-stream-provider";
import { queryClient } from "@/providers/query-provider";
import type { ChatMessage } from "@/types/chat";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { uuidv7 } from "uuidv7";

type ChatProps = {
  id: string;
  initialMessages: ChatMessage[];
  autoResume: boolean;
};
const Chat = ({ id, autoResume, initialMessages }: ChatProps) => {
  const [input, setInput] = useState("");
  const router = useRouter();
  const { setDataStream } = useDataStream();
  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
    clearError,
    resumeStream,
  } = useChat({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: uuidv7,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            message: messages.at(-1),
            ...body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onFinish: () => {
      // window.history.replaceState({}, '', `/c/${id}`);
      router.replace(`/c/${id}`);
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        // Check if it's a credit card error
        if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          toast.error(error.message);
        } else {
          toast.error(error.message);
        }
      }
    },
  });

  
  const submitForm = useCallback(() => {
    sendMessage({
      role: 'user',
      parts: [
        {
          type: 'text',
          text: input,
        },
      ],
    });

    setInput('');
  }, [
    input,
    sendMessage
  ]);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
      <Conversation className="max-h-[calc(100vh-200px)]">
        <ConversationContent className="px-6 scroll-smooth snap-y snap-mandatory">
          {messages.map((message) => (
            <div key={message.id} className="snap-start">
              {message.role === "assistant" &&
                message.parts.filter((part) => part.type === "source-url")
                  .length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === "source-url"
                        ).length
                      }
                    />
                    {message.parts
                      .filter((part) => part.type === "source-url")
                      .map((part, i) => (
                        <SourcesContent key={`${message.id}-${i}`}>
                          <Source
                            key={`${message.id}-${i}`}
                            href={part.url}
                            title={part.url}
                          />
                        </SourcesContent>
                      ))}
                  </Sources>
                )}
              {message.parts.length > 0 &&
                message.parts
                  .filter(
                    (part) =>
                      part.type === "text" &&
                      part.text.replace("\n\n", "").length > 0
                  )
                  .map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Message from={message.role}>
                              <MessageContent>
                                <Response>{part.text}</Response>
                              </MessageContent>
                            </Message>
                            {message.role === "assistant" && (
                                <Actions>
                                  {/* <Action
                                    onClick={() =>
                                      regenerate({ messageId: message.id })
                                    }
                                    label="Retry"
                                  >
                                    <RefreshCcwIcon className="size-3" />
                                  </Action> */}
                                  <CopyButton text={part.text} />
                                </Actions>
                              )}
                          </Fragment>
                        );
                      case "reasoning":
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full"
                            isStreaming={
                              status === "streaming" &&
                              i === message.parts.length - 1 &&
                              message.id === messages.at(-1)?.id
                            }
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      default:
                        return null;
                    }
                  })}
            </div>
          ))}
          {(status === "submitted" || status === "streaming") &&
            messages.length > 0 && <Loader />}
          {error && messages.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg snap-start">
              <p className="text-red-800">Hata: {error.message}</p>
              <div className="mt-2 space-x-2">
                <button
                  type="button"
                  onClick={() => clearError()}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Hatayı Temizle
                </button>
                <button
                  type="button"
                  onClick={() => resumeStream()}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Yeniden Bağlan
                </button>
              </div>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput
        onSubmit={submitForm}
        globalDrop
        multiple
      >
        <PromptInputBody>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </PromptInputBody>
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            {/* <PromptInputButton
              variant={webSearch ? "default" : "ghost"}
              onClick={() => setWebSearch(!webSearch)}
            >
              <GlobeIcon size={16} />
              <span>Search</span>
            </PromptInputButton>
            <PromptInputModelSelect
              onValueChange={(value) => {
                setModel(value);
              }}
              value={model}
            >
              <PromptInputModelSelectTrigger>
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                {models.map((model) => (
                  <PromptInputModelSelectItem
                    key={model.value}
                    value={model.value}
                  >
                    {model.name}
                  </PromptInputModelSelectItem>
                ))}
              </PromptInputModelSelectContent>
            </PromptInputModelSelect> */}
          </PromptInputTools>
          <PromptInputSubmit
            disabled={status === "submitted" || status === "streaming"}
            status={status}
          />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
};

export default Chat;
