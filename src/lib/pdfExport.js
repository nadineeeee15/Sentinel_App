import { jsPDF } from "jspdf";
import { formatDate } from "@/lib/dates";

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
  other: "Other Cybersecurity Incident",
};

function imageFormatFromDataUrl(dataUrl) {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "JPEG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

export function exportReportPDF(incident, attachments = []) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Cybersecurity Incident Report", margin, 40);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Confidential — for submission to local authorities", margin, 54);

  y = 88;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(incident.title || "Untitled Incident", margin, y);
  y += 8;

  // Metadata block
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const meta = [
    ["Category", CATEGORY_LABELS[incident.category] || incident.category],
    ["Severity", (incident.severity || "medium").toUpperCase()],
    ["Status", (incident.status || "reported").replace("_", " ")],
    ["When", incident.incident_date ? formatDate(incident.incident_date) : "Not provided"],
    ["Where", incident.location || "Not provided"],
    ["Report generated", incident.report_generated_date ? formatDate(incident.report_generated_date) : "Not generated"],
  ];
  y += 6;
  meta.forEach(([k, v]) => {
    ensureSpace(16);
    doc.setTextColor(100, 116, 139);
    doc.text(`${k}:`, margin, y);
    doc.setTextColor(15, 23, 42);
    const valLines = doc.splitTextToSize(String(v), contentW - 90);
    doc.text(valLines, margin + 88, y);
    y += Math.max(16, valLines.length * 13);
  });

  y += 10;
  ensureSpace(20);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 18;

  // AI report body (render markdown-ish text)
  if (incident.ai_report) {
    doc.setTextColor(15, 23, 42);
    const lines = incident.ai_report.split("\n");
    lines.forEach((raw) => {
      const line = raw.replace(/\*\*/g, "");
      if (!line.trim()) {
        y += 8;
        return;
      }
      let fontSize = 10;
      let bold = false;
      if (line.startsWith("# ")) {
        fontSize = 14; bold = true;
      } else if (line.startsWith("## ")) {
        fontSize = 11; bold = true;
      } else if (line.startsWith("### ")) {
        fontSize = 10; bold = true;
      }
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      const text = line.replace(/^#+\s*/, "");
      const wrapped = doc.splitTextToSize(text, contentW);
      wrapped.forEach((wl) => {
        ensureSpace(fontSize + 4);
        doc.setTextColor(bold ? 15 : 51, bold ? 23 : 65, bold ? 42 : 102);
        doc.text(wl, margin, y);
        y += fontSize + 4;
      });
      if (bold) y += 2;
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("No AI-generated report was produced for this incident.", margin, y);
    y += 16;
  }

  // Attachments
  if (attachments.length > 0) {
    y += 14;
    ensureSpace(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Supporting Evidence (Attachments)", margin, y);
    y += 16;

    attachments.forEach((att, idx) => {
      const isImage = (att.type || "").startsWith("image");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const label = `Attachment ${idx + 1}: ${att.name || "image"}`;
      ensureSpace(20);
      doc.text(label, margin, y);
      y += 12;

      if (isImage && att.dataUrl) {
        const fmt = imageFormatFromDataUrl(att.dataUrl);
        const maxW = contentW;
        const maxH = pageH - margin - y - 16;
        try {
          const props = doc.getImageProperties(att.dataUrl);
          let w = props.width;
          let h = props.height;
          const scale = Math.min(maxW / w, (maxH > 120 ? maxH : 320) / h);
          w = w * scale;
          h = h * scale;
          if (h > pageH - margin * 2) {
            const s = (pageH - margin * 2) / h;
            w *= s; h *= s;
          }
          ensureSpace(h + 10);
          doc.addImage(att.dataUrl, fmt, margin, y, w, h);
          y += h + 14;
        } catch (e) {
          ensureSpace(16);
          doc.text("[Image could not be embedded]", margin, y);
          y += 16;
        }
      } else {
        ensureSpace(16);
        doc.text("[Non-image attachment not shown]", margin, y);
        y += 16;
      }
      y += 6;
    });
  }

  // Footer page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 24, { align: "right" });
    doc.text("Generated locally on this device", margin, pageH - 24);
  }

  const safeTitle = (incident.title || "incident").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`incident-report-${safeTitle}.pdf`);
}