/** BikePark operator & rider copy — keep short; details belong in training docs */

export const COPY = {
  appName: "BikePark",
  tagline: "Safe parking for bikes and micromobility at council events.",
  /** Shown only in expanded “About” on hub — keep hub footer minimal */
  operatorFooter: "Standalone mode · no Council login required",

  activeEvent: "Current session",
  eventPlaceholder: "Community event",
  createEventCta: "Create event",
  createEventTitle: "New event",
  createEventLead: "Add a council event to run parking for.",
  createEventSuccessTitle: "Event created",
  statsTitle: "Session",
  statsHint: "Updates when devices are checked in or returned.",
  glanceTitle: "Right now",
  glanceHint: "",
  onSiteLabel: "Still parked",
  checkedInLabel: "Checked in",
  sessionCardHint: "Event name syncs when live",

  breakdownTitle: "By device type",
  breakdownCollapsedHint: "Optional detail",
  actionsTitle: "",
  dropOffTitle: "Drop-off",
  dropOffSubtitle: "Register riders and park devices",
  pickUpTitle: "Pick-up",
  pickUpSubtitle: "Match tickets and hand gear back",
  preRegTitle: "Pre-register",
  preRegSubtitle: "Before the event",
  preRegShort: "Pre-register",

  demoBadge: "Demo",
  demoHint: "Simulate counts until the backend is connected.",

  respondentLead: "Search the list or use walk-up.",
  walkUpHeaderSubtitle: "Details on the next screen.",
  pickupRespondentLead: "Find their registration to continue.",
  walkUpPanelTitle: "Walk-up",
  walkUpPanelBody: "Tap Continue — we’ll capture their details next.",
  respondentBlank: "Walk-up",
  respondentPreReg: "On the list",
  searchPlaceholder: "Name or mobile",

  ticketLead: "Search by name or mobile.",
  registerLead: "Confirm rider, ticket, and devices.",
  /** Selected from “On the list” at drop-off */
  dropOffListTitle: "Check in rider",
  dropOffListLead: "Review their pre-registration, assign a lanyard, then check in. Tap Edit if details changed.",
  dropOffEditDetails: "Edit rider & devices",
  dropOffDoneEditing: "Done editing",
} as const;
