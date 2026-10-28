import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Search, ShieldAlert, Loader2, LifeBuoy, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import PixelDecor from "@/components/PixelDecor";
import PeekCat from "@/components/PeekCat";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import IncidentCard from "@/components/incidents/IncidentCard";
import StatPills from "@/components/incidents/StatPills";
import { useTheme } from "@/lib/ThemeContext";
import { decryptIncident } from "@/lib/incidentCrypto";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

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
  const { dark } = useTheme();
  const [incidents, setIncidents] = useState(null);
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  async function load() {
    setIncidents(null);
    try {
      const [data, me] = await Promise.all([
        base44.entities.Incident.list("-incident_date", 200),
        base44.auth.me().catch(() => null),
      ]);
      setUser(me);
      if (!data.length) {
        setIncidents([]);
        return;
      }
      // Decrypt incrementally so the list fills in as each record unlocks,
      // instead of blocking on Promise.all over every record at once.
      for (const item of data) {
        const dec = await decryptIncident(item);
        setIncidents((prev) => (prev === null ? [dec] : [...prev, dec]));
      }
    } catch (e) {
      setIncidents([]);
    }
  }

  useEffect(() => { load(); }, []);

  const { pull, refreshing } = usePullToRefresh(load);

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
    <div className={`mx-auto min-h-dvh max-w-md ${dark ? "bg-gradient-to-b from-[#0d0518] via-[#120724] to-[#08030f] text-white" : "bg-background text-foreground"}`}>
      {(pull > 0 || refreshing) && (
        <div className="pointer-events-none fixed left-1/2 top-0 z-50 -translate-x-1/2" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="flex items-center justify-center" style={{ height: Math.max(pull, refreshing ? 40 : 0) }}>
            <Loader2 className={"h-5 w-5 text-primary " + (refreshing ? "animate-spin" : "")} />
          </div>
        </div>
      )}
      {/* Greeting header */}
      <header className="px-5 pb-3 pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-600 to-fuchsia-700 p-5 text-white shadow-2xl shadow-fuchsia-900/30">
          <PixelDecor />
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative text-xs font-medium uppercase tracking-wider text-violet-100"
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
            className="relative mt-1 pr-16 text-sm text-violet-100"
          >
            Report what happened and stay safe.
          </motion.p>

          <div className="relative mt-4 grid grid-cols-2 gap-2">
            <PeekCat className="absolute bottom-full right-4 h-[50px] w-[64px]" />
            <Link
              to="/new"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-3 py-2.5 text-sm font-medium backdrop-blur-md transition hover:bg-white/25 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> New report
            </Link>
            <Link
              to="/authorities"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-3 py-2.5 text-sm font-medium backdrop-blur-md transition hover:bg-white/25 active:scale-[0.98]"
            >
              <LifeBuoy className="h-4 w-4" /> Get Help
            </Link>
          </div>
        </div>

        {/* Search + filter */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-violet-200/70" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports"
              aria-label="Search reports"
              className="rounded-full border-border bg-card text-foreground placeholder:text-muted-foreground pl-9 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-violet-200/60"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Filter reports by status" className="w-[8.5rem] rounded-full border-border bg-card text-foreground capitalize backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-white">
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
          <h2 className="text-sm font-semibold text-foreground dark:text-violet-100">Recent reports</h2>
          {incidents != null && (
            <span className="text-xs text-muted-foreground dark:text-violet-300/70">{reportsReady} with AI report</span>
          )}
        </div>

        {incidents === null ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground dark:text-violet-300/70">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center text-muted-foreground dark:text-violet-300/70">
            <div className="rounded-2xl border border-border bg-card p-4 dark:border-white/10 dark:bg-white/5">
              <ShieldAlert className="h-8 w-8 text-primary dark:text-violet-300" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground dark:text-violet-100">
              {incidents.length === 0 ? "No incidents reported yet" : "No matches"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground dark:text-violet-300/60">
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
            className="space-y-3"
          >
            {filtered.map((i, idx) => (
              <motion.div
                key={i.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx, duration: 0.35, ease: "easeOut" }}
              >
                <IncidentCard incident={i} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-violet-200">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary dark:text-violet-300" />
          <p>Photos and screenshots you attach are stored only on this device for your privacy.</p>
        </div>
      </main>
    </div>
  );
}