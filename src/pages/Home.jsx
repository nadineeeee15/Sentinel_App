import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Search, ShieldAlert, Loader2, MapPin, LifeBuoy, ShieldCheck, FileText, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import PixelDecor from "@/components/PixelDecor";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import IncidentCard from "@/components/incidents/IncidentCard";
import StatPills from "@/components/incidents/StatPills";
import SafetyOverview from "@/components/incidents/SafetyOverview";
import QuickTools from "@/components/incidents/QuickTools";

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
  const drafts = (incidents || []).filter((i) => i.status === "draft").length;

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-gradient-to-b from-[#1a0b2e] via-[#1f0d38] to-[#140722]">
      {/* Greeting header */}
      <header className="px-5 pb-3 pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-violet-600 to-fuchsia-700 p-5 text-white shadow-2xl shadow-fuchsia-900/30">
          <PixelDecor />
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative text-xs font-medium uppercase tracking-wider text-violet-200"
          >
            {todayLabel()}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className="relative mt-1 text-2xl font-semibold tracking-tight"
          >
            {greeting()}, {firstName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.4 }}
            className="relative mt-1 text-sm text-violet-100"
          >
            Report what happened and stay safe.
          </motion.p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              to="/new"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/15 px-3 py-2.5 text-sm font-medium backdrop-blur-md transition hover:bg-white/25 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> New report
            </Link>
            <Link
              to="/authorities"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/15 px-3 py-2.5 text-sm font-medium backdrop-blur-md transition hover:bg-white/25 active:scale-[0.98]"
            >
              <LifeBuoy className="h-4 w-4" /> Get Help
            </Link>
          </div>
        </div>

        {/* Search + filter */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-200/70" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports"
              className="rounded-full border-white/10 bg-white/10 text-white placeholder:text-violet-200/60 pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[8.5rem] rounded-full border-white/10 bg-white/10 text-white capitalize backdrop-blur">
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
        <SafetyOverview incidents={incidents} />
      </header>

      {/* List */}
      <main className="px-5 pb-16 pt-2">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-violet-100">Recent activity</h2>
          {incidents != null && (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                drafts === 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"
              }`}
            >
              {drafts === 0 ? "All clear" : `${drafts} draft${drafts > 1 ? "s" : ""}`}
            </span>
          )}
        </div>

        {incidents === null ? (
          <div className="flex items-center justify-center py-20 text-violet-300/70">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center text-violet-300/70">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <ShieldAlert className="h-8 w-8 text-violet-300" />
            </div>
            <p className="mt-3 text-sm font-medium text-violet-100">
              {incidents.length === 0 ? "No incidents reported yet" : "No matches"}
            </p>
            <p className="mt-1 text-xs text-violet-300/60">
              {incidents.length === 0
                ? "Tap “New report” to begin."
                : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"
          >
            {filtered.map((i, idx) => (
              <div key={i.id} className={idx > 0 ? "border-t border-white/10" : ""}>
                <IncidentCard incident={i} />
              </div>
            ))}
          </motion.div>
        )}

        <QuickTools />

        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-violet-200">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
          <p>Photos and screenshots you attach are stored only on this device for your privacy.</p>
        </div>
      </main>
    </div>
  );
}