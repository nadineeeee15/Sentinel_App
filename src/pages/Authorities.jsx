import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Navigation, Phone, Globe, Loader2, RefreshCw, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthoritiesMap from "@/components/incidents/AuthoritiesMap";
import { getNearbyAuthorities, getCurrentPosition, formatDistance } from "@/lib/authorities";

export default function Authorities() {
  const [pos, setPos] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function locate() {
    setLoading(true);
    setError("");
    try {
      const p = await getCurrentPosition();
      setPos(p);
      const found = await getNearbyAuthorities(p.lat, p.lon);
      setItems(found);
    } catch (e) {
      setError(e.message || "Could not load nearby authorities.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { locate(); }, []);

  const kindLabel = (k) => (k === "civic" ? "Civic office" : k);

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-slate-50">
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-white/85 px-4 py-3 backdrop-blur-md">
        <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-slate-900">Nearby Authorities</h1>
          <p className="truncate text-xs text-slate-400">Police stations & government offices near you</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={locate} disabled={loading}>
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
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
            <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={locate}>Try again</Button>
          </div>
        ) : (
          <>
            <AuthoritiesMap userPos={pos} items={items} />
            <p className="mt-3 text-xs text-slate-400">
              {items.length} places found within 12 km of your location.
            </p>
            <div className="mt-3 space-y-2">
              {items.map((it) => (
                <div key={it.id} className="rounded-2xl border border-slate-200 bg-white p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{it.name}</p>
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
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}