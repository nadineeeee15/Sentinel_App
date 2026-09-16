import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, MapPin, CalendarDays, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SeverityBadge, StatusBadge } from "@/components/incidents/IncidentBadge";
import IncidentSheet from "@/components/incidents/IncidentSheet";
import { Image } from "@/components/ui/image";
import { formatRelative, formatDate } from "@/lib/dates";

const STATUSES = ["open", "in_progress", "resolved", "closed"];

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await base44.entities.Incident.get(id);
      setIncident(data);
      setNotFound(!data);
    } catch (e) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function changeStatus(next) {
    if (!incident || next === incident.status) return;
    setUpdating(true);
    try {
      const updated = await base44.entities.Incident.update(incident.id, { status: next });
      setIncident(updated);
    } catch (e) {
      // ignore
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!incident) return;
    if (!confirm("Delete this incident? This can't be undone.")) return;
    setDeleting(true);
    try {
      await base44.entities.Incident.delete(incident.id);
      navigate("/");
    } catch (e) {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold text-slate-800">Incident not found</p>
        <Link to="/" className="text-sm text-slate-500 underline">Back to incidents</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-slate-50">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-white/85 px-4 py-3 backdrop-blur-md">
        <Link
          to="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setSheetOpen(true)}
          >
            <Pencil className="mr-1 h-4 w-4" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-rose-600 hover:bg-rose-50"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="px-5 pb-16 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
          <span className="text-xs text-slate-400 capitalize">{incident.category}</span>
        </div>

        <h1 className="mt-3 text-xl font-semibold leading-snug text-slate-900">
          {incident.title}
        </h1>

        {incident.photo_url && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <Image
              src={incident.photo_url}
              alt={incident.title}
              className="h-56 w-full object-cover"
              fittingType="fill"
            />
          </div>
        )}

        <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
          {incident.location && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-slate-400" />
              {incident.location}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            {formatDate(incident.incident_date)} · {formatRelative(incident.incident_date)}
          </div>
        </div>

        {incident.description && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {incident.description}
            </p>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</h2>
          <Select
            value={incident.status}
            onValueChange={changeStatus}
            disabled={updating}
          >
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
      </main>

      <IncidentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        incident={incident}
        onSaved={(saved) => setIncident(saved)}
      />
    </div>
  );
}