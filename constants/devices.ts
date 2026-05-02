export type DeviceCategory = {
  key: string;
  label: string;
  indent?: boolean;
};

export const DEVICE_CATEGORIES: DeviceCategory[] = [
  { key: "bikes", label: "Bikes" },
  { key: "ebikes", label: "eBikes" },
  { key: "trailers", label: "Trailers", indent: true },
  { key: "scooters", label: "Scooters" },
  { key: "escooters", label: "eScooters" },
  { key: "skateboards", label: "Skateboards" },
  { key: "wagons", label: "Wagons" },
  { key: "prams", label: "Prams" },
  { key: "other", label: "Other" },
];
