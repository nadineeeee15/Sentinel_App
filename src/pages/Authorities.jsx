import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Search, Globe, Phone, Loader2, MapPin, ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AuthoritiesMap from "@/components/incidents/AuthoritiesMap";
import EmergencyNumbers from "@/components/help/EmergencyNumbers";
import { searchAuthorities, getNearbyAuthorities, getCurrentPosition, formatDistance } from "@/lib/authorities";

const KIND_LABEL = {
  police: "Police station",
  fire: "Fire station",
  government: "Government office",
  civic: "Civic office",
  other: "Local authority",
};

const NEARBY_OPTIONS = [
  { value: "police", label: "Police station" },
  { value: "fire", label: "Fire station" },
  { value: "government", label: "Gov / Civic" },
  { value: "all", label: "All nearby" },
];

export default function Authorities() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [userPos, setUserPos] = useState(null);

  const runSearch = useCallback(async (q) => {
    const term = (q ?? query).trim();
    if (!term) return;
    setQuery(term);
    setLoading(true);
    setError("");
    setSearched(true);
    setUserPos(null);
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

  const runNearby = useCallback(async (category) => {
    setLoading(true);
    setError("");
    setSearched(true);
    setQuery("");
    try {
      const pos = await getCurrentPosition();
      setUserPos(pos);
      const found = await getNearbyAuthorities(pos.lat, pos.lon, { category, radiusMeters: 15000 });
      setItems(found);
    } catch (e) {
      setError(e.message || "Could not find your location.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    runSearch(query);
  }

  const mapKey = items[0] ? `${items[0].id}-${items[0].lat}` : "empty";

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background text-foreground">
      <header className="sticky top-0 z-20 bg-background/85 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex-1 text-center text-base font-semibold uppercase tracking-wide text-foreground">
            Get Help
          </h1>
          <div className="h-9 w-9" />
        </div>
        <div className="mx-auto mt-2 h-px w-24 bg-primary" />
      </header>

      <main className="space-y-8 px-4 pb-16 pt-2">
        {/* 1. Government emergency numbers */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            1. Government emergency numbers
          </h2>
          <EmergencyNumbers />
        </section>

        {/* 2. Live / nearest help */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            2. Live / nearest help
          </h2>
          <form onSubmit={onSubmit} className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs font-medium text-foreground">Find help near you (uses your location):</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {NEARBY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => runNearby(opt.value)}
                      className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10"
                    >
                      <MapPin className="h-4 w-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Or search by name:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Police station", "Fire station", "Town hall"].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => runSearch(ex)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="mt-2 text-sm">Searching…</p>
            </div>
          )}

          {error && !loading && (
            <div className="mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-300">
              {error}
              <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => runSearch(query)}>
                Try again
              </Button>
            </div>
          )}

          {searched && !loading && !error && (
            <>
              <p className="mt-3 text-xs text-muted-foreground">
                {items.length} result{items.length === 1 ? "" : "s"} found{userPos ? " near you" : ""}.
              </p>
              {items.length > 0 && <AuthoritiesMap key={mapKey} userPos={userPos} items={items} />}
              {items.length === 0 ? (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  No matching places found. Try a different search.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {items.map((it) => (
                    <div key={it.id} className="rounded-2xl border border-border bg-card p-3.5">
                      <p className="truncate text-sm font-semibold text-foreground">{it.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {KIND_LABEL[it.kind] || it.kind}
                        {it.distance != null && ` · ${formatDistance(it.distance)} away`}
                      </p>
                      {it.fullName && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{it.fullName}</p>
                      )}
                      <div className="mt-2.5 space-y-1.5">
                        {it.phone && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {it.phone}
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