import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Fingerprint, KeyRound, LogOut, Lock, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import {
  biometricAvailable, enableBiometric, biometricEnabled, disableBiometric,
} from "@/lib/biometric";

const NAME_KEY = "sentinel_user_name";
const PIN_KEY = "sentinel_app_pin";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [bioSupported, setBioSupported] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
    biometricAvailable().then(setBioSupported);
    setBioOn(biometricEnabled());
    try {
      setPinSet(!!localStorage.getItem(PIN_KEY));
    } catch {}
  }, []);

  async function toggleBio(on) {
    setBusy(true);
    setMsg("");
    try {
      if (on) {
        await enableBiometric();
        setBioOn(true);
        setMsg("Biometric unlock enabled.");
      } else {
        disableBiometric();
        setBioOn(false);
        setMsg("Biometric unlock disabled.");
      }
    } catch (e) {
      setBioOn(false);
      setMsg(e?.message || "Biometric is unavailable here. Use your PIN instead.");
    } finally {
      setBusy(false);
    }
  }

  function resetLock() {
    if (!confirm("Reset your app lock? You'll set a new PIN next time you open Sentinel.")) return;
    try {
      localStorage.removeItem(PIN_KEY);
    } catch {}
    disableBiometric();
    setBioOn(false);
    setPinSet(false);
    setMsg("App lock reset. Set a new PIN on next launch.");
  }

  async function signOut() {
    await base44.auth.logout();
  }

  const localName =
    (typeof localStorage !== "undefined" && localStorage.getItem(NAME_KEY)) || "";
  const displayName = user?.full_name || localName || "Sentinel user";
  const email = user?.email || "";

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-24">
      <header className="px-5 pb-3 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Profile</h1>
      </header>

      <main className="space-y-6 px-5">
        {/* Identity */}
        <section className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <User className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="truncate text-xs text-slate-400">{email || "Signed-in user"}</p>
          </div>
        </section>

        {/* Security */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Security
          </h2>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-800">App lock</p>
                  <p className="text-xs text-slate-400">
                    {pinSet ? "PIN set" : "No PIN set"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" onClick={resetLock}>
                Reset
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Biometric unlock</p>
                  <p className="text-xs text-slate-400">
                    {bioSupported ? "Face / Fingerprint" : "Not available on this device"}
                  </p>
                </div>
              </div>
              <Switch
                checked={bioOn}
                disabled={!bioSupported || busy}
                onCheckedChange={toggleBio}
              />
            </div>
          </div>
        </section>

        {/* Account */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Account
          </h2>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            <Link to="/forgot-password" className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-slate-400" />
                <p className="text-sm font-medium text-slate-800">Change password</p>
              </div>
              <span className="text-xs text-slate-400">Via email reset</span>
            </Link>
            <button onClick={signOut} className="flex w-full items-center gap-3 p-4 text-left">
              <LogOut className="h-5 w-5 text-slate-400" />
              <p className="text-sm font-medium text-rose-600">Sign out</p>
            </button>
          </div>
        </section>

        <div className="flex items-start gap-2 rounded-2xl bg-violet-50 p-3 text-xs text-violet-700">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
          <p>Your app lock and biometric settings are stored only on this device.</p>
        </div>

        {msg && <p className="text-center text-xs text-slate-500">{msg}</p>}
      </main>
    </div>
  );
}