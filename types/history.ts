export type HistoryParams = {
    limit: number;
    ending_before: string | null;
  }
  
  export interface HistoryResponse {
    chats:   HistoryChat[];
    hasMore: boolean;
  }
  
  export interface HistoryChat {
    id:          string;
    title:       string;
    visibility:  string;
    lastContext: LastContext;
    createdAt:   Date;
    updatedAt:   Date;
  }
  
  export interface LastContext {
    inputTokens:  number;
    totalTokens:  number;
    outputTokens: number;
  }
  