/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CENTRAL SITE CONFIGURATION
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the master switchboard for replaceable assets and gated content.
 * Everything that is "not yet confirmed" or "not yet uploaded" is controlled
 * from here so nothing unverified is ever shown by accident.
 */

export const siteConfig = {
  /**
   * RESUME
   * To enable the resume button everywhere on the site:
   *   1. Drop your PDF at:  public/resume/Harshil_Jadawala_Resume.pdf
   *   2. Set `available` to true.
   * Until then, resume buttons are hidden and a contact CTA is shown instead
   * (per the content rules: never show a download button for a missing file).
   */
  resume: {
    available: false,
    url: "/resume/Harshil_Jadawala_Resume.pdf",
    label: "Download Resume",
  },

  /**
   * UNCONFIRMED CLAIMS GATE
   * Set a flag to true ONLY after Harshil confirms the claim is accurate.
   */
  confirmed: {
    coralVisionPlacement: false, // "2nd place at UNHack" — confirm before showing
    orientationLeader: false, // York Orientation Week Leader — confirm role was accepted/completed
    certifications: false, // First Aid / Food Handler / WHMIS etc. — confirm each before listing
    servoMeasurements: false, // turret servo dimensions — confirm before publishing as specs
  },

  /** Default 3D quality: "high" | "balanced" | "performance" (auto-detected too) */
  defaultQuality: "balanced" as const,

  /** Show the sound toggle (all audio is procedurally generated, muted by default) */
  soundEnabled: true,
};

export type Quality = "high" | "balanced" | "performance";
