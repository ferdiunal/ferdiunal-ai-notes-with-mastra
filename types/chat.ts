import type { MessageMetadata } from "@/models";
import type { UIMessage } from "ai";
import type { AppUsage } from "./useage";


export type CustomUIDataTypes = {
    text: string;
    appendMessage: string;
    id: string;
    title: string;
    clear: null;
    finish: null;
    usage: AppUsage;
  };

  
export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  Record<string, never>
>;
