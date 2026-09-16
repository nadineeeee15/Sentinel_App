import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const CATEGORY_LABELS = {
  phishing: "Phishing",
  malware: "Malware",
  ransomware: "Ransomware",
  data_breach: "Data Breach",
  unauthorized_access: "Unauthorized Access",
  social_engineering: "Social Engineering",
  ddos: "Denial of Service (DDoS)",
  account_compromise: "Account Compromise",
  insider_threat: "Insider Threat",
  identity_theft: "Identity Theft",
  online_fraud: "Online Fraud / Scam",
  other: "Other Cybersecurity Incident"
};

function buildPrompt(input) {
  const categoryLabel = CATEGORY_LABELS[input.category] || input.category;
  const when = input.incidentDate ? new Date(input.incidentDate).toLocaleString() : "Not specified";
  const where = input.location || "Not specified";
  const severity = (input.severity || "medium").toUpperCase();

  return `You are a specialist cybersecurity incident report writer. A user has reported a cybersecurity incident and provided a raw firsthand description. Your job is to transform that raw account into a clear, formal, professional incident report that the reporter could submit to a local authority (such as a police station, a national Computer Emergency Response Team (CERT), or a cybercrime unit).

STRICT RULES:
- Use ONLY the facts the reporter provided. Do NOT invent names, dates, URLs, account numbers, suspect identities, financial amounts, or technical indicators that are not present in the input.
- If a detail is missing, write "Not provided" rather than guessing.
- Do NOT request or reference any images or attachments — this report is generated from text only, for privacy. You may include a placeholder note that supporting evidence (screenshots/photos) is retained locally by the reporter and is available on request.
- Write in a formal, objective, third-person tone suitable for an official submission.
- Use Markdown with the section headings below, in this order.

Produce the report with exactly these sections:

# Cybersecurity Incident Report
## 1. Report Overview
(A one-paragraph summary: category, severity, when, where, and the nature of the incident.)
## 2. Incident Classification
- Category: ${categoryLabel}
- Severity: ${severity}
- Status: Reported
## 3. Incident Description
(A clear, formal restatement of what the reporter described. Preserve all concrete facts: what happened, how it was discovered, what systems/accounts/data were involved, and any indicators of compromise mentioned. Do not add new facts.)
## 4. Chronology
(A simple timeline based only on dates/times the reporter gave. If none were given, state "Not provided".)
## 5. Impact Assessment
(Describe the potential or actual impact based strictly on the report — e.g. data exposed, systems affected, financial loss mentioned, services disrupted. If impact is unknown, say so.)
## 6. Evidence Retained
(Short note: the reporter has retained supporting evidence (e.g. screenshots, photos) locally on their device for privacy. Available to authorities on request.)
## 7. Recommended Actions
(3-6 concise, practical next steps appropriate for this category — e.g. preserve evidence, change credentials, report to bank, contact CERT, file a police report. Generic best-practice guidance, not specific facts about this case.)
## 8. Reporter's Notes
(Any additional context the reporter included that did not fit above, or "None provided".)

REPORTER'S RAW INPUT (use only this as the source of facts):
- Title: ${input.title || "Not provided"}
- Category: ${categoryLabel}
- Severity: ${severity}
- When it happened: ${when}
- Where: ${where}
- Description: """${input.description || "Not provided"}"""

Return ONLY the Markdown report, no preamble or explanation.`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { title, category, severity, description, location, incidentDate } = body || {};
    if (!description || !category) {
      return Response.json({ error: 'Description and category are required' }, { status: 400 });
    }

    const prompt = buildPrompt({ title, category, severity, description, location, incidentDate });
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    return Response.json({ report: result, generated_at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}