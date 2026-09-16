import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Navigation, Phone, Globe, Loader2, RefreshCw, Search,
  Shield, Flame, Building2, Landmark, LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthoritiesMap from "@/components/incidents/AuthoritiesMap";
import {
  getNearbyAuthorities, getCurrentPosition, formatDistance, CATEGORIES,
} from "@/lib/authorities";

const CATEGORY_ICONS = {
  all: LayoutGrid,
  police: Shield,
  fire: Flame,
  government: Building2,
  civic: Landmark,
};

export default function Authorities() {
  const [pos, setPos] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const locate = useCallback(async (cat) => {
    setLoading(true);
    setError("");
    try {
      const p = await getCurrentPosition();
      setPos(p);
      const found = await getNearbyAuthorities(p.lat, p.lon, { category: cat });
      setItems(found);
    } catch (e) {
      setError(e.message || "Could not load nearby authorities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { locate("all"); }, [locate]);

  function selectCategory(cat) {
    setCategory(cat);
    setSearch("");
    locate(cat);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  const kindLabel = (k) => (k === "civic" ? "Civic office" : k === "fire" ? "Fire station" : k);

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-slate-50">
      <header className="sticky top-0 z-20 bg-white/85 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold text-slate-900">Nearby Authorities</h1>
            <p className="truncate text-xs text-slate-400">Live results from OpenStreetMap</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => locate(category)} disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c.value];
            const active = category === c.value;
            return (
              <button
                key={c.value}
                onClick={() => selectCategory(c.value)}
                className={
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition " +
                  (active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="rounded-full pl-9"
          />
        </div>
      </header>

      <main className="px-4 pb-16 pt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="mt-2 text-sm">Finding nearby authorities…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
            <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => locate(category)}>Try again</Button>
          </div>
        ) : (
          <>
            <AuthoritiesMap userPos={pos} items={filtered} />
            <p className="mt-3 text-xs text-slate-400">
              {filtered.length} of {items.length} places within 12 km{search ? " matching your search" : ""}.
            </p>
            {filtered.length === 0 ? (
              <div className="mt-6 text-center text-sm text-slate-400">
                No matching authorities found. Try a different category or search.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {filtered.map((it) => {
                  const KindIcon = CATEGORY_ICONS[it.kind] || LayoutGrid;
                  return (
                    <div key={it.id} className="rounded-2xl border border-slate-200 bg-white p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <KindIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <p className="truncate text-sm font-semibold text-slate-900">{it.name}</p>
                          </div>
                          <p className="text-xs capitalize text-slate-400">{kindLabel(it.kind)}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {formatDistance(it.distance)}
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {it.phone && (
                          <a href={`tel:${it.phone}`} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                            <Phone className="h-3.5 w-3.5" /> Call
                          </a>
                        )}
                        {it.website && (
                          <a href={it.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                            <Globe className="h-3.5 w-3.5" /> Website
                          </a>
                        )}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${it.lat},${it.lon}`}
                          target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground"
                        >
                          <Navigation className="h-3.5 w-3.5" /> Directions
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}