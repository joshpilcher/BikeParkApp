/** Demo inventory for pick-up handover — replace with API by patron / ticket */

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

const ANDY: PatronParked = {
  ticket: "123",
  devices: [
    {
      id: "d1",
      kind: "E-scooter",
      detail: "Blue · rear rack",
      bay: "Row A · rack 3",
    },
    {
      id: "d2",
      kind: "Mountain bike",
      detail: "Navy frame · ABUS lock",
      bay: "Row A · rack 3",
    },
  ],
};

const BY_PATRON_ID: Record<string, PatronParked> = {
  "1": ANDY,
};

/** Resolve parked devices for handover (demo). Replace with GET /patrons/:id/devices */
export function getParkedForPatron(patronId: string | undefined, patronName: string): PatronParked {
  const id = patronId?.trim();
  if (id && BY_PATRON_ID[id]) {
    return BY_PATRON_ID[id];
  }
  const n = patronName.toLowerCase();
  if (n.includes("andy")) {
    return ANDY;
  }
  return { ticket: "—", devices: [] };
}
