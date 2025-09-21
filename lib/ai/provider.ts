import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { ProviderV2 } from "@ai-sdk/provider-v5";
import type { EmbeddingModel, LanguageModel } from "ai";
import { env } from "@/env";

type AiClient = "openai" | "google-generative-ai" | "lmstudio";

let instance: ProviderV2 | undefined;
const createAiClient = (key: AiClient) => {
  if (instance) {
    return instance;
  }

  switch (key) {
    case "openai":
      instance = createOpenAI({
        apiKey: env.OPENAI_API_KEY,
        baseURL: env.OPENAI_BASE_URL,
      });
      break;
    case "google-generative-ai":
      instance = createGoogleGenerativeAI({
        apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
      });
      break;
    case "lmstudio":
      instance = createOpenAICompatible({
        name: "lmstudio",
        baseURL: env.OPENAI_BASE_URL,
      });
      break;
  }
  return instance;
};
export const myProvider = {
  chatModel: (): LanguageModel =>
    createAiClient("lmstudio").languageModel(env.CHAT_MODEL),
  embeddingModel: (): EmbeddingModel =>
    createAiClient("lmstudio").textEmbeddingModel(env.EMBEDDING_MODEL),
  titleModel: (): LanguageModel =>
    createAiClient("lmstudio").languageModel(env.AI_TITLE_MODEL),
};
