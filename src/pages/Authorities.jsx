import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Search, Globe, Phone, Loader2, MapPin, ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AuthoritiesMap from "@/components/incidents/AuthoritiesMap";
import EmergencyNumbers from "@/components/help/EmergencyNumbers";
import { searchAuthorities } from "@/lib/authorities";

const KIND_LABEL = {
  police: "Police station",
  fire: "Fire station",
  government: "Government office",
  civic: "Civic office",
  other: "Local authority",
};

const EXAMPLES = ["Police station", "Fire station", "Town hall", "Government office"];

export default function Authorities() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (q) => {
    const term = (q ?? query).trim();
    if (!term) return;
    setQuery(term);
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const found = await searchAuthorities(term);
      setItems(found);
    } catch (e) {
      setError(e.message || "Search failed.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  function onSubmit(e) {
    e.preventDefault();
    runSearch(query);
  }

  const mapKey = items[0] ? `${items[0].id}-${items[0].lat}` : "empty";

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background">
      <header className="sticky top-0 z-20 bg-background/85 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex-1 text-center text-base font-semibold uppercase tracking-wide text-slate-900">
            Get Help
          </h1>
          <div className="h-9 w-9" />
        </div>
        <div className="mx-auto mt-2 h-px w-24 bg-primary" />
      </header>

      <main className="space-y-8 px-4 pb-16 pt-2">
        {/* 1. Government emergency numbers */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            1. Government emergency numbers
          </h2>
          <EmergencyNumbers />
        </section>

        {/* 2. Live / nearest help */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            2. Live / nearest help
          </h2>
          <form onSubmit={onSubmit} className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. police station Auckland"
                className="rounded-full pl-9"
              />
            </div>
            <Button type="submit" disabled={loading || !query.trim()} className="rounded-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </form>

          {!searched && !loading && (
            <div className="mt-3">
              <p className="text-xs text-slate-400">Try a common search:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => runSearch(ex)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-primary"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="mt-2 text-sm">Searching…</p>
            </div>
          )}

          {error && !loading && (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
              <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => runSearch(query)}>
                Try again
              </Button>
            </div>
          )}

          {searched && !loading && !error && (
            <>
              <p className="mt-3 text-xs text-slate-400">
                {items.length} result{items.length === 1 ? "" : "s"} found.
              </p>
              {items.length > 0 && <AuthoritiesMap key={mapKey} userPos={null} items={items} />}
              {items.length === 0 ? (
                <div className="mt-4 text-center text-sm text-slate-400">
                  No matching places found. Try a different search.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {items.map((it) => (
                    <div key={it.id} className="rounded-2xl border border-slate-200 bg-white p-3.5">
                      <p className="truncate text-sm font-semibold text-slate-900">{it.name}</p>
                      <p className="text-xs capitalize text-slate-400">{KIND_LABEL[it.kind] || it.kind}</p>
                      {it.fullName && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-slate-400">{it.fullName}</p>
                      )}
                      <div className="mt-2.5 space-y-1.5">
                        {it.phone && (
                          <p className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400" /> {it.phone}
                          </p>
                        )}
                        {it.website ? (
                          <a
                            href={it.website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                          >
                            <Globe className="h-3.5 w-3.5" /> Visit website
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.fullName || it.name)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                          >
                            <MapPin className="h-3.5 w-3.5" /> Find on Maps
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}