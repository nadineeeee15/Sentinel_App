import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Search, ShieldAlert, Loader2, MapPin, ShieldCheck, FileText, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import IncidentCard from "@/components/incidents/IncidentCard";
import StatPills from "@/components/incidents/StatPills";

const STATUSES = ["all", "draft", "completed"];

function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 22) return "Good evening";
  return "Good night";
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

export default function Home() {
  const [incidents, setIncidents] = useState(null);
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  async function load() {
    try {
      const [data, me] = await Promise.all([
        base44.entities.Incident.list("-incident_date", 200),
        base44.auth.me().catch(() => null),
      ]);
      setIncidents(data);
      setUser(me);
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

  const localName = (typeof localStorage !== "undefined" && localStorage.getItem("sentinel_user_name")) || "";
  const firstName = (localName || user?.full_name || "").split(" ")[0] || "there";
  const reportsReady = (incidents || []).filter((i) => i.ai_report).length;

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background">
      {/* Greeting header */}
      <header className="px-5 pb-3 pt-6">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-violet-800 p-5 text-white shadow-lg shadow-violet-500/20">
          <p className="text-xs font-medium uppercase tracking-wider text-violet-200">
            {todayLabel()}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-violet-100">
            Report what happened and stay safe.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              to="/new"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-3 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/25 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> New report
            </Link>
            <Link
              to="/authorities"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-3 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/25 active:scale-[0.98]"
            >
              <MapPin className="h-4 w-4" /> Authorities
            </Link>
          </div>
        </div>

        {/* Search + filter */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports"
              className="rounded-full border-slate-200 bg-white pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[8.5rem] rounded-full border-slate-200 bg-white capitalize">
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
      <main className="px-5 pb-16 pt-2">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Recent reports</h2>
          {incidents != null && (
            <span className="text-xs text-slate-400">{reportsReady} with AI report</span>
          )}
        </div>

        {incidents === null ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center text-slate-400">
            <div className="rounded-2xl bg-violet-50 p-4">
              <ShieldAlert className="h-8 w-8 text-violet-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">
              {incidents.length === 0 ? "No incidents reported yet" : "No matches"}
            </p>
            <p className="mt-1 text-xs">
              {incidents.length === 0
                ? "Tap “New report” to begin."
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

        <div className="mt-6 flex items-start gap-2 rounded-2xl bg-violet-50 p-3 text-xs text-violet-700">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
          <p>Photos and screenshots you attach are stored only on this device for your privacy.</p>
        </div>
      </main>
    </div>
  );
}