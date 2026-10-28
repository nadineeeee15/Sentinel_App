// Whether the user has agreed to send report text to the AI service.
// Asked once before the first summary; can be withdrawn in Profile.
const AI_CONSENT_KEY = "sentinel_ai_consent";

export function hasAiConsent() {
  try {
    return localStorage.getItem(AI_CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAiConsent(on) {
  try {
    if (on) localStorage.setItem(AI_CONSENT_KEY, "1");
    else localStorage.removeItem(AI_CONSENT_KEY);
  } catch {}
}
