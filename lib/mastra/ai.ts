// import { createGoogleGenerativeAI  } from "@ai-sdk/google";
import { createOpenAI  } from "@ai-sdk/openai";
import { env } from "@/env";

// import { createGoogleGenerativeAI } from "@ai-sdk/google";

// export const model = createGoogleGenerativeAI({
//   apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
// });

const model = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: "http://localhost:1234/v1",
});

export const chatModel = model.chat(env.CHAT_MODEL);

export const embedding = model.textEmbeddingModel(
  env.EMBEDDING_MODEL,
);