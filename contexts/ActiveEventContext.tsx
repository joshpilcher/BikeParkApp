import { useFocusEffect } from "@react-navigation/native";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { isSupabaseConfigured, supabase } from "../lib/supabase";

type ActiveEventContextValue = {
  liveEventId: string | null;
  liveEventName: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ActiveEventContext = createContext<ActiveEventContextValue | null>(null);

export function ActiveEventProvider({ children }: { children: ReactNode }) {
  const [liveEventId, setLiveEventId] = useState<string | null>(null);
  const [liveEventName, setLiveEventName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLiveEventId(null);
      setLiveEventName(null);
      setError("Supabase env not configured");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: qErr } = await supabase
      .from("events")
      .select("id, name")
      .eq("status", "live")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (qErr) {
      setError(qErr.message);
      setLiveEventId(null);
      setLiveEventName(null);
    } else {
      setLiveEventId(data?.id ?? null);
      setLiveEventName(data?.name ?? null);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const value = useMemo<ActiveEventContextValue>(
    () => ({
      liveEventId,
      liveEventName,
      loading,
      error,
      refresh,
    }),
    [liveEventId, liveEventName, loading, error, refresh],
  );

  return (
    <ActiveEventContext.Provider value={value}>{children}</ActiveEventContext.Provider>
  );
}

export function useActiveEvent(): ActiveEventContextValue {
  const ctx = useContext(ActiveEventContext);
  if (!ctx) {
    throw new Error("useActiveEvent must be used within ActiveEventProvider");
  }
  return ctx;
}
