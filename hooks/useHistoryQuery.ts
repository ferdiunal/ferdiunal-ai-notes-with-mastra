"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { HistoryParams, HistoryResponse } from "@/types/history";

const fetchHistory = async (params: HistoryParams) => {
    const response = await axios.get("/api/history", { params });
    return response.data;
}

export const useHistoryQuery = (params: HistoryParams) => useQuery<HistoryResponse, Error, HistoryResponse>({
    queryKey: ["history"],
    queryFn: () => fetchHistory(params),
  })