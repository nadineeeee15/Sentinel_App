import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, MapPin, CalendarDays, Trash2, Loader2, Download, FileText, ShieldCheck, Hash, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SeverityBadge, StatusBadge } from "@/components/incidents/IncidentBadge";
import { CATEGORY_LABELS } from "@/components/incidents/CategorySelect";
import AttachmentInput from "@/components/incidents/AttachmentInput";
import { formatRelative, formatDate } from "@/lib/dates";
import {
  getAttachments, addInMemoryAttachment, deleteAttachment, deleteAttachmentsForIncident,
} from "@/lib/attachments";
import { exportReportPDF } from "@/lib/pdfExport";
import { decryptIncident } from "@/lib/incidentCrypto";

const STATUSES = ["draft", "completed"];

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await base44.entities.Incident.get(id);
      const decrypted = data ? await decryptIncident(data) : data;
      setIncident(decrypted);
      setNotFound(!data);
      try { setAttachments(await getAttachments(id)); } catch { setAttachments([]); }
    } catch (e) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function changeStatus(next) {
    if (!incident || next === incident.status) return;
    setUpdating(true);
    try {
      const updated = await base44.entities.Incident.update(incident.id, { status: next });
      setIncident(updated ? await decryptIncident(updated) : updated);
    } catch (e) {} finally { setUpdating(false); }
  }

  async function handleAdd(att) {
    try {
      const saved = await addInMemoryAttachment(incident.id, att);
      setAttachments((prev) => [...prev, saved]);
    } catch (e) {}
  }

  async function handleRemove(idx) {
    const att = attachments[idx];
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
    if (att?.id != null) {
      try { await deleteAttachment(att.id); } catch {}
    }
  }

  async function handleDelete() {
    if (!incident) return;
    if (!confirm("Delete this report? This can't be undone.")) return;
    setDeleting(true);
    try {
      await deleteAttachmentsForIncident(incident.id);
      await base44.entities.Incident.delete(incident.id);
      navigate("/");
    } catch (e) { setDeleting(false); }
  }

  function handleExport() {
    setExporting(true);
    try {
      exportReportPDF(incident, attachments);
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold text-foreground">Report not found</p>
        <Link to="/" className="text-sm text-muted-foreground underline">Back to reports</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background text-foreground">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-card/85 px-4 py-3 backdrop-blur-md">
        <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
            PDF
          </Button>
          <Button
            variant="outline" size="sm"
            className="rounded-full text-rose-600 hover:bg-rose-500/10"
            onClick={handleDelete} disabled={deleting}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="px-5 pb-16 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
          <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[incident.category] || incident.category}</span>
        </div>

        {incident._locked && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>This report is locked — it was encrypted with a previous PIN and can't be recovered. Reset your PIN to start fresh.</p>
          </div>
        )}
        <h1 className="mt-3 text-xl font-semibold leading-snug text-foreground">
          {incident._locked ? "Locked report" : incident.title}
        </h1>

        <div className="mt-4 space-y-2 rounded-2xl border border-border bg-card p-4">
          {incident.report_number && (
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Report #</span>
              <span className="font-medium text-foreground">{incident.report_number}</span>
            </div>
          )}
          {!incident._locked && incident.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-muted-foreground" /> {incident.location}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {formatDate(incident.incident_date)} · {formatRelative(incident.incident_date)}
          </div>
        </div>

        {/* AI Report */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Professional Report
            </h2>
          </div>
          {incident._locked ? (
            <p className="mt-2 text-sm text-muted-foreground">
              This report's content is locked — it was encrypted with a previous PIN and can't be recovered.
            </p>
          ) : incident.ai_report ? (
            <pre className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-card-foreground">
              {incident.ai_report}
            </pre>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No AI report was generated for this incident.</p>
          )}
        </div>

        {/* Attachments (local only) */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Attachments</h2>
          <div className="mt-3">
            <AttachmentInput
              attachments={attachments}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          </div>
          <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
            <p>Stored only on this device. They are included when you export the PDF.</p>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</h2>
          <Select value={incident.status} onValueChange={changeStatus} disabled={updating}>
            <SelectTrigger className="mt-2 capitalize">
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Find authorities */}
        <Link
          to="/authorities"
          className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-500/10 p-2">
              <MapPin className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Find nearby authorities</p>
              <p className="text-xs text-muted-foreground">Police stations & government offices near you</p>
            </div>
          </div>
          <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground/50" />
        </Link>
      </main>
    </div>
  );
}