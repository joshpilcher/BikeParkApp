import { supabase } from "./supabase";

export type ParkedDeviceRow = {
  id: string;
  kind: string;
  detail: string;
  bay?: string;
  status: string;
};

export type ParkedBundle = {
  ticket: string;
  visitId: string | null;
  devices: ParkedDeviceRow[];
};

/** Active visit + devices still on site for pick-up */
export async function fetchParkedForPatron(
  eventId: string,
  patronId: string,
): Promise<ParkedBundle> {
  const { data: visits, error: visitErr } = await supabase
    .from("visits")
    .select("id, lanyard_number")
    .eq("event_id", eventId)
    .eq("patron_id", patronId)
    .eq("status", "active");

  if (visitErr || !visits?.length) {
    return { ticket: "—", visitId: null, devices: [] };
  }

  const visit = visits[0];
  const visitIds = visits.map((v) => v.id);
  const ticket =
    visit.lanyard_number != null ? String(visit.lanyard_number) : "—";

  const { data: devices, error: deviceErr } = await supabase
    .from("devices")
    .select("id, kind_label, detail_notes, bay_zone, status")
    .in("visit_id", visitIds)
    .in("status", ["checked_in", "parked"]);

  if (deviceErr) {
    return { ticket, visitId: visit.id, devices: [] };
  }

  const list = devices ?? [];

  return {
    ticket,
    visitId: visit.id,
    devices: list.map((d) => ({
      id: d.id,
      kind: d.kind_label,
      detail: d.detail_notes,
      bay: d.bay_zone ?? undefined,
      status: d.status,
    })),
  };
}
