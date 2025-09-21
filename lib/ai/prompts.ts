import { generateText, type UIMessage } from "ai";
import { myProvider } from "./provider";

export async function generateTitleFromUserMessage({
    message,
  }: {
    message: UIMessage;
  }) {
    const { text: title } = await generateText({
      model: myProvider.titleModel(),
      system: `\n
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - the title should be in the same language as the user's message
      - do not use quotes or colons`,
      prompt: JSON.stringify(message),
    });
  
    return title.trim();
  }

export function systemPrompt() {
    return `\n
    You are a helpful assistant that can answer questions and help with tasks.
    - Always answer in the same language as the user's message.`;
}

export function instructionsPrompt() {
    return `\n
    You are a helpful assistant that can answer questions and help with tasks.
    - Always answer in the same language as the user's message.`;
}