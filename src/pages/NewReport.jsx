import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, ArrowRight, Loader2, Sparkles, Check, ShieldCheck, FileText, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import CategorySelect, { CATEGORY_LABELS } from "@/components/incidents/CategorySelect";
import AttachmentInput from "@/components/incidents/AttachmentInput";
import { SeverityBadge } from "@/components/incidents/IncidentBadge";
import { persistInMemoryAttachments } from "@/lib/attachments";
import { exportReportPDF } from "@/lib/pdfExport";
import { encryptIncident } from "@/lib/incidentCrypto";

const STEPS = ["Category", "Details", "Attachments", "Report", "Review"];

function toLocalInput(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function NewReport() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [location, setLocation] = useState("");
  const [incidentDate, setIncidentDate] = useState(toLocalInput(new Date().toISOString()));
  const [attachments, setAttachments] = useState([]);
  const [report, setReport] = useState("");
  const [reportNumber, setReportNumber] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function next() {
    if (step === 0 && !category) { setError("Select a category to continue."); return; }
    if (step === 1 && !(title.trim().length >= 3 && description.trim().length >= 10)) {
      setError("Add a title and a description (min 10 characters) to continue.");
      return;
    }
    if (step === 3 && !report) { setError("Generate your report to continue."); return; }
    setError("");
    setStep((s) => s + 1);
  }

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const res = await base44.functions.invoke("generateIncidentReport", {
        title, category, severity, description, location,
        incidentDate: new Date(incidentDate).toISOString(),
      });
      setReport(res.data.report);
      setReportNumber(res.data.report_number);
      setGeneratedAt(res.data.generated_at);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not generate the report.");
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const created = await base44.entities.Incident.create(
        await encryptIncident({
          title: title.trim(),
          description: description.trim(),
          category,
          severity,
          status: "completed",
          location: location.trim(),
          incident_date: new Date(incidentDate).toISOString(),
          ai_report: report,
          report_generated_date: generatedAt,
          report_number: reportNumber,
        })
      );
      if (attachments.length) {
        try { await persistInMemoryAttachments(created.id, attachments); } catch {}
      }
      navigate(`/incidents/${created.id}`);
    } catch (e) {
      setError(e?.message || "Could not save the report.");
      setSaving(false);
    }
  }

  async function saveDraftAndLeave() {
    if (title.trim().length >= 3 && category) {
      try {
        const created = await base44.entities.Incident.create(
          await encryptIncident({
            title: title.trim(),
            description: description.trim(),
            category,
            severity,
            status: "draft",
            location: location.trim(),
            incident_date: new Date(incidentDate).toISOString(),
            ...(report
              ? { ai_report: report, report_generated_date: generatedAt, report_number: reportNumber }
              : {}),
          })
        );
        if (attachments.length) {
          try { await persistInMemoryAttachments(created.id, attachments); } catch {}
        }
      } catch (e) {}
    }
    navigate("/");
  }

  const incidentForPdf = {
    title, category, severity, status: "draft",
    location, incident_date: new Date(incidentDate).toISOString(),
    ai_report: report, report_generated_date: generatedAt, report_number: reportNumber,
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background text-foreground">
      <header className="sticky top-0 z-20 bg-card/85 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button onClick={saveDraftAndLeave} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-foreground">New Incident Report</h1>
            <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </header>

      <main className="px-5 pb-28 pt-4">
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">What type of incident are you reporting?</p>
            <CategorySelect value={category} onChange={setCategory} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Someone keeps messaging me from new numbers"
                maxLength={140}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "critical"].map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">When it happened</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where it occurred or was observed"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened in your own words — what was said or done, when and how often, who was involved, and how it affected you…"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">{description.trim().length} characters · min 10</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Optionally add screenshots or photos as evidence. These stay on your device.
            </p>
            <AttachmentInput
              attachments={attachments}
              onAdd={(a) => setAttachments((prev) => [...prev, a])}
              onRemove={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
            />
            <p className="text-xs text-muted-foreground">
              You can skip this and add attachments later from the report page.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl bg-primary/10 p-3 text-xs text-primary">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Only your text description is sent to the AI to draft a formal report. No images
                leave your device.
              </p>
            </div>
            {!report ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="rounded-2xl bg-muted p-4">
                  <Sparkles className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-card-foreground">Generate your professional report</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  The AI will turn your description into a formal report you can submit to a local
                  authority.
                </p>
                <Button onClick={generate} disabled={generating} className="mt-1 rounded-full">
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {generating ? "Writing report…" : "Generate report"}
                </Button>
                {error && <p className="text-sm text-rose-600">{error}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" /> Report generated
                </div>
                <div className="max-h-[55vh] overflow-y-auto rounded-2xl border border-border bg-card p-4">
                  <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-card-foreground">
                    {report}
                  </pre>
                </div>
                <Button variant="outline" size="sm" onClick={generate} disabled={generating} className="rounded-full">
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={severity} />
                <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[category]}</span>
              </div>
              <h2 className="mt-2 text-base font-semibold text-foreground">{title}</h2>
              {location && <p className="mt-1 text-xs text-muted-foreground">{location}</p>}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Report</h3>
              <pre className="mt-2 max-h-40 overflow-hidden whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-card-foreground">
                {report}
              </pre>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Attachments ({attachments.length})
              </h3>
              {attachments.length > 0 ? (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {attachments.map((a, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-lg border border-border">
                      <img src={a.dataUrl} alt={a.name} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">No attachments added.</p>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
              <p>Attachments will be saved only on this device after you save the report.</p>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => exportReportPDF(incidentForPdf, attachments)}
            >
              <Download className="mr-2 h-4 w-4" /> Export PDF now
            </Button>
          </div>
        )}

        {error && step !== 3 && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </main>

      {/* Footer nav */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              className="flex-1 rounded-full"
              onClick={next}
            >
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button className="flex-1 rounded-full" disabled={saving} onClick={save}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              {saving ? "Saving…" : "Save report"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}