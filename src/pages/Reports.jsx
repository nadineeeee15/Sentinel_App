import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Loader2, Plus, FolderOpen, CheckCircle2, ShieldCheck, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import IncidentCard from "@/components/incidents/IncidentCard";
import { decryptIncident } from "@/lib/incidentCrypto";

export default function Reports() {
  const [incidents, setIncidents] = useState(null);

  useEffect(() => {
    let cancelled = false;
    base44.entities.Incident.list("-incident_date", 200)
      .then(async (data) => {
        if (cancelled) return;
        if (!data.length) {
          setIncidents([]);
          return;
        }
        for (const item of data) {
          const dec = await decryptIncident(item);
          if (cancelled) return;
          setIncidents((prev) => (prev === null ? [dec] : [...prev, dec]));
        }
      })
      .catch(() => { if (!cancelled) setIncidents([]); });
    return () => { cancelled = true; };
  }, []);

  const drafts = (incidents || []).filter((i) => i.status === "draft");
  const completed = (incidents || []).filter((i) => i.status === "completed");

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-20 text-foreground">
      <header className="px-5 pb-2 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your report space is private and ready when you are.
        </p>
      </header>

      <main className="px-5 pt-2">
        {incidents === null ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="rounded-2xl border border-border bg-card p-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">No reports yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              When you log an incident, it will appear here under Drafts or Completed.
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link to="/new"><Plus className="mr-2 h-4 w-4" /> New report</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <div className="mb-2 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Drafts</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-sm font-medium text-muted-foreground">
                  {drafts.length}
                </span>
              </div>
              {drafts.length === 0 ? (
                <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  No draft reports.
                </p>
              ) : (
                <div className="space-y-3">
                  {drafts.map((i) => (
                    <IncidentCard key={i.id} incident={i} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Completed</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-sm font-medium text-muted-foreground">
                  {completed.length}
                </span>
              </div>
              {completed.length === 0 ? (
                <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  No completed reports.
                </p>
              ) : (
                <div className="space-y-3">
                  {completed.map((i) => (
                    <IncidentCard key={i.id} incident={i} />
                  ))}
                </div>
              )}
            </section>

            <div className="flex items-start gap-2 rounded-2xl border border-border bg-card p-3 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>Only you can see your reports. Attachments stay on this device.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}