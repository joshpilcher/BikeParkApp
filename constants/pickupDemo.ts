/** Parked-device handover — replace with API by patron / ticket */

export type ParkedDevice = {
  id: string;
  kind: string;
  detail: string;
  bay?: string;
};

export type PatronParked = {
  ticket: string;
  devices: ParkedDevice[];
};

const EMPTY: PatronParked = { ticket: "—", devices: [] };

/** Resolve parked devices for handover. Replace with GET /patrons/:id/devices */
export function getParkedForPatron(_patronId: string | undefined, _patronName: string): PatronParked {
  return EMPTY;
}
