import { DEVICE_CATEGORIES } from "../constants/devices";
import { supabase } from "./supabase";

export type EventSessionStats = {
  stillParked: number;
  checkedInTotal: number;
};

/** Header stats via event_session_stats (active visits only; completed pickup excluded) */
export async function fetchEventSessionStats(eventId: string): Promise<EventSessionStats> {
  const { data, error } = await supabase.rpc("event_session_stats", {
    p_event_id: eventId,
  });

  if (error) {
    return { stillParked: 0, checkedInTotal: 0 };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    stillParked: Number(row?.still_parked ?? 0),
    checkedInTotal: Number(row?.checked_in_total ?? 0),
  };
}

const EMPTY_BREAKDOWN = Object.fromEntries(DEVICE_CATEGORIES.map((d) => [d.key, 0])) as Record<
  string,
  number
>;

/** On-site device mix: category_key for devices still checked in / parked (active visits only; released excluded) */
export async function fetchDeviceCategoryBreakdown(
  eventId: string,
): Promise<Record<string, number>> {
  const { data: visits, error: vErr } = await supabase
    .from("visits")
    .select("id")
    .eq("event_id", eventId)
    .eq("status", "active");

  if (vErr || !visits?.length) {
    return { ...EMPTY_BREAKDOWN };
  }

  const visitIds = visits.map((v) => v.id);
  const { data: devices, error: dErr } = await supabase
    .from("devices")
    .select("category_key")
    .in("visit_id", visitIds)
    .in("status", ["checked_in", "parked"]);

  if (dErr || !devices) {
    return { ...EMPTY_BREAKDOWN };
  }

  const counts = { ...EMPTY_BREAKDOWN };
  for (const d of devices) {
    const key = d.category_key?.trim();
    if (key && key in counts) {
      counts[key] += 1;
    } else {
      counts.other += 1;
    }
  }
  return counts;
}
