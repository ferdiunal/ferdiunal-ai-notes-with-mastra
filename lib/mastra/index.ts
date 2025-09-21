import { Mastra } from "@mastra/core";
import { uuidv7 } from "uuidv7";
import { ragAgent } from "./agents/rag";
import logger from "./logger";
import { libsqlVector } from "./memory";

export const mastra = new Mastra({
  agents: {
    rag: ragAgent,
  },
  vectors: {
    libsqlVector,
  },
  idGenerator: uuidv7,
  telemetry: {
    enabled: false,
  },
  server: {
    build: {
      openAPIDocs: true,
      swaggerUI: true
    },
  },
  logger: logger,
});
