import { Agent } from "@mastra/core";
import { createVectorQueryTool } from "@mastra/rag";
import { chatModel, embedding } from "../ai";
import { libsqlVector, memory } from "../memory";


const vectorQueryTool = createVectorQueryTool({
    vectorStore: libsqlVector,
    indexName: "pdf_chunks",
    model: embedding,
})

export const ragAgent = new Agent({
  name: "Kitaplık RAG Agent",
  description: "RAG Agent",
  tools: {
    vectoryQuery: vectorQueryTool,
  },
  instructions: "",
  model: chatModel,
  memory: memory,
});