import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, SlidersHorizontal, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IncidentCard from "@/components/incidents/IncidentCard";
import IncidentSheet from "@/components/incidents/IncidentSheet";
import StatPills from "@/components/incidents/StatPills";

const STATUSES = ["all", "open", "in_progress", "resolved", "closed"];

export default function Home() {
  const [incidents, setIncidents] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    try {
      const data = await base44.entities.Incident.list("-incident_date", 200);
      setIncidents(data);
    } catch (e) {
      setIncidents([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!incidents) return [];
    const q = query.trim().toLowerCase();
    return incidents.filter((i) => {
      if (status !== "all" && i.status !== status) return false;
      if (!q) return true;
      return (
        i.title?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q)
      );
    });
  }, [incidents, query, status]);

  function handleSaved(saved) {
    setIncidents((prev) => {
      if (!prev) return [saved];
      const exists = prev.some((i) => i.id === saved.id);
      return exists
        ? prev.map((i) => (i.id === saved.id ? saved : i))
        : [saved, ...prev];
    });
    setEditing(null);
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/85 px-5 pb-3 pt-5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Incident Log</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Incidents</h1>
          </div>
          <Button
            size="icon"
            className="h-11 w-11 rounded-full shadow-sm"
            onClick={() => { setEditing(null); setSheetOpen(true); }}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search incidents"
              className="rounded-full border-slate-200 bg-slate-100 pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[8.5rem] rounded-full border-slate-200 bg-slate-100 capitalize">
              <SlidersHorizontal className="mr-1 h-4 w-4 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s === "all" ? "All statuses" : s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <StatPills incidents={incidents} />
      </header>

      {/* List */}
      <main className="px-5 pb-28 pt-2">
        {incidents === null ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center text-slate-400">
            <div className="rounded-2xl bg-slate-100 p-4">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">
              {incidents.length === 0 ? "No incidents logged yet" : "No matches"}
            </p>
            <p className="mt-1 text-xs">
              {incidents.length === 0
                ? "Tap the + button to record your first one."
                : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((i) => (
              <IncidentCard key={i.id} incident={i} />
            ))}
          </div>
        )}
      </main>

      {/* Floating action button for mobile reach */}
      <button
        onClick={() => { setEditing(null); setSheetOpen(true); }}
        className="fixed bottom-6 left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/30 transition active:scale-95 sm:hidden"
        aria-label="Log incident"
      >
        <Plus className="h-6 w-6" />
      </button>

      <IncidentSheet
        open={sheetOpen}
        onOpenChange={(o) => { setSheetOpen(o); if (!o) setEditing(null); }}
        incident={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}