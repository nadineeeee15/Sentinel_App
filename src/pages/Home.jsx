import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Search, ShieldAlert, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import IncidentCard from "@/components/incidents/IncidentCard";
import StatPills from "@/components/incidents/StatPills";

const STATUSES = ["all", "reported", "in_review", "escalated", "resolved", "closed"];

export default function Home() {
  const [incidents, setIncidents] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  async function load() {
    try {
      const data = await base44.entities.Incident.list("-incident_date", 200);
      setIncidents(data);
    } catch (e) {
      setIncidents([]);
    }
  }

  useEffect(() => { load(); }, []);

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

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-slate-50">
      <header className="sticky top-0 z-20 bg-white/85 px-5 pb-3 pt-5 backdrop-blur-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Cyber Incident Reporter</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Your reports</h1>
          </div>
          <Link
            to="/authorities"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="Find nearby authorities"
          >
            <MapPin className="h-5 w-5" />
          </Link>
        </div>

        <Link
          to="/new"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" /> Report a new incident
        </Link>

        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports"
              className="rounded-full border-slate-200 bg-slate-100 pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[8.5rem] rounded-full border-slate-200 bg-slate-100 capitalize">
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

      <main className="px-5 pb-16 pt-2">
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
              {incidents.length === 0 ? "No incidents reported yet" : "No matches"}
            </p>
            <p className="mt-1 text-xs">
              {incidents.length === 0
                ? "Tap “Report a new incident” to begin."
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

        <div className="mt-6 flex items-start gap-2 rounded-2xl bg-slate-100 p-3 text-xs text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p>Photos and screenshots you attach are stored only on this device for your privacy.</p>
        </div>
      </main>
    </div>
  );
}