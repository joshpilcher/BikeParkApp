export type DeviceCategory = {
  key: string;
  label: string;
  indent?: boolean;
};

export const DEVICE_CATEGORIES: DeviceCategory[] = [
  { key: "bikes", label: "Bike" },
  { key: "ebikes", label: "eBike" },
  { key: "trailers", label: "Trailer", indent: true },
  { key: "scooters", label: "Scooter" },
  { key: "escooters", label: "eScooter" },
  { key: "skateboards", label: "Skateboard" },
  { key: "wagons", label: "Wagon" },
  { key: "prams", label: "Pram" },
  { key: "other", label: "Other" },
];

/** Singular / shorthand spellings → category key (for matching saved kind_label text) */
const KIND_LABEL_ALIASES: Record<string, string> = {
  bike: "bikes",
  ebike: "ebikes",
  trailer: "trailers",
  scooter: "scooters",
  escooter: "escooters",
  skateboard: "skateboards",
  wagon: "wagons",
  pram: "prams",
};

/** Form row shared by pre-register and desk check-in */
export type DeviceFormRow = {
  categoryKey: string;
  notes: string;
  /** When categoryKey is `other`, short description of the device (stored in kind_label) */
  otherDescription: string;
};

export function deviceCategoryLabel(categoryKey: string): string {
  const k = categoryKey.trim();
  if (!k) return "";
  return DEVICE_CATEGORIES.find((c) => c.key === k)?.label ?? "";
}

/** Label saved as devices.kind_label / pre_registration_devices.kind_label */
export function deviceKindLabelFromRow(row: DeviceFormRow): string {
  if (row.categoryKey === "other") {
    return row.otherDescription.trim() || "Other";
  }
  return deviceCategoryLabel(row.categoryKey) || "Other";
}

/** Map saved kind_label / legacy text back to a category key for the picker */
export function categoryKeyFromStoredLabel(kindLabel: string): string {
  const t = kindLabel.trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  const hit = DEVICE_CATEGORIES.find((c) => c.key === lower || c.label.toLowerCase() === lower);
  if (hit) return hit.key;
  const viaAlias = KIND_LABEL_ALIASES[lower];
  if (viaAlias) return viaAlias;
  return "other";
}

/** After resolving categoryKey, recover custom “Other” text from stored kind_label */
export function otherDescriptionFromStoredKind(kindLabel: string, categoryKey: string): string {
  if (categoryKey !== "other") return "";
  const t = kindLabel.trim();
  if (!t || t.toLowerCase() === "other") return "";
  const matchesNonOther = DEVICE_CATEGORIES.some(
    (c) => c.key !== "other" && (c.key === t.toLowerCase() || c.label.toLowerCase() === t.toLowerCase()),
  );
  if (matchesNonOther) return "";
  return t;
}
