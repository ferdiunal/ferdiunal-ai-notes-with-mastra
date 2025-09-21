import { fastembed } from "@mastra/fastembed";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { Memory } from "@mastra/memory";

const storageUrl = "file:/Users/ferdiunal/Apps/ai-notes/storage.db";
// LibSQL storage - hem storage hem de vector için aynı veritabanı
const storage = new LibSQLStore({
  url: storageUrl,
});

// LibSQL vector - dimension limiti yok, daha esnek
export const libsqlVector = new LibSQLVector({
    connectionUrl: storageUrl,
});

export const memory = new Memory({
  storage,
  vector: libsqlVector,
  embedder: fastembed,
  options: {
    lastMessages: 10,
    semanticRecall: {
      topK: 3,
      messageRange: 2,
      scope: "resource",
    },
    threads: {
      generateTitle: true,
    },
  },
});
