"use client";

import { useState } from "react";
import { movementsPageSchema, type Movement, type MovementsPage } from "@/domain/contracts";
import { apiRequest } from "@/lib/http/api-client";

export type MovementFilter = "all" | "incoming" | "outgoing";

interface FeedState {
  movements: Movement[];
  nextCursor: string | null;
  status: "idle" | "loading" | "error";
}

const emptyFeed: FeedState = { movements: [], nextCursor: null, status: "loading" };

export function useMovementsFeed(firstPage: MovementsPage) {
  const [filter, setFilter] = useState<MovementFilter>("all");
  const [feeds, setFeeds] = useState<Partial<Record<MovementFilter, FeedState>>>({
    all: { ...firstPage, status: "idle" },
  });

  const current = feeds[filter] ?? emptyFeed;

  async function load(target: MovementFilter, cursor: string | null) {
    setFeeds((prev) => ({ ...prev, [target]: { ...(prev[target] ?? emptyFeed), status: "loading" } }));

    const params = new URLSearchParams();
    if (target !== "all") params.set("direction", target);
    if (cursor) params.set("cursor", cursor);
    const result = await apiRequest(`/api/movements?${params}`, movementsPageSchema);

    setFeeds((prev) => {
      const before = prev[target] ?? emptyFeed;
      if (!result.ok) return { ...prev, [target]: { ...before, status: "error" } };
      return {
        ...prev,
        [target]: {
          movements: cursor ? [...before.movements, ...result.value.movements] : result.value.movements,
          nextCursor: result.value.nextCursor,
          status: "idle",
        },
      };
    });
  }

  return {
    filter,
    movements: current.movements,
    hasMore: current.nextCursor !== null,
    status: current.status,
    initialLoading: current.status === "loading" && current.movements.length === 0,
    selectFilter(next: MovementFilter) {
      setFilter(next);
      if (!feeds[next]) void load(next, null);
    },
    loadMore() {
      if (current.status === "loading" || !current.nextCursor) return;
      void load(filter, current.nextCursor);
    },
    retry() {
      void load(filter, current.movements.length > 0 ? current.nextCursor : null);
    },
  };
}
