const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
};

export const sourceRegistry = deepFreeze([
  {
    id: "fssai-central",
    authority: "Food Safety and Standards Authority of India",
    jurisdiction: "India",
    access: "uncertain",
    method: "Official publication review",
    lastChecked: null,
    note: "No restaurant-level public API has been assumed. Connector approval and access terms remain open."
  },
  {
    id: "telangana-food-safety",
    authority: "Telangana Food Safety Department",
    jurisdiction: "Telangana",
    access: "uncertain",
    method: "Official notices and publications review",
    lastChecked: null,
    note: "A lawful, structured Telangana source is not yet verified in this build."
  }
]);

export const publicState = deepFreeze({
  coverage: "not-yet-available",
  records: [],
  message: "SIFT has not published an inspection record for this area yet. That is not evidence that any business is safe.",
  provenance: "No verified source publication is connected to this view."
});

export { deepFreeze };
