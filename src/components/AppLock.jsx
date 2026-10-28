import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Delete, ShieldAlert, Fingerprint, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SentinelLogo from "@/components/SentinelLogo";
import { cn } from "@/lib/utils";
import {
  biometricAvailable, enableBiometric, biometricEnabled, biometricUnlock, disableBiometric,
} from "@/lib/biometric";
import {
  setupNewPinEncryption, unlockWithPin, hasWrappedDek, unlockWithBiometric,
  enableBiometricEncryption, generateSessionDek, clearWrappedDek, hasSessionKey,
} from "@/lib/crypto";
import { migrateLegacyAttachments } from "@/lib/attachments";
import { useAutoLock } from "@/hooks/useAutoLock";

const NAME_KEY = "sentinel_user_name";
const PIN_KEY = "sentinel_app_pin";

function hashPin(pin) {
  let h = 5381;
  for (let i = 0; i < pin.length; i++) h = (h * 33) + pin.charCodeAt(i);
  return String(h >>> 0);
}

function getStoredPin() {
  try { return localStorage.getItem(PIN_KEY); } catch { return null; }
}
function getStoredName() {
  try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; }
}

let persistRequested = false;
async function requestPersistentStorage() {
  if (persistRequested) return;
  persistRequested = true;
  try {
    await navigator.storage?.persist?.();
    const persisted = await navigator.storage?.persisted?.();
    console.info("[Sentinel] Persistent storage granted:", persisted);
  } catch {}
}

function Dots({ display, shake }) {
  return (
    <div className={cn("mt-6 flex gap-3", shake && "animate-[shake_0.4s]")}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "h-3.5 w-3.5 rounded-full border-2 transition",
            i < display.length ? "border-primary bg-primary" : "border-slate-300 bg-transparent"
          )}
        />
      ))}
    </div>
  );
}

function Keypad({ onPress, onDel }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  return (
    <div className="mt-6 grid grid-cols-3 gap-3">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => onPress(k)}
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-semibold text-slate-800 shadow-sm transition active:scale-95 hover:bg-violet-50"
        >
          {k}
        </button>
      ))}
      <div />
      <button
        onClick={() => onPress("0")}
        className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-semibold text-slate-800 shadow-sm transition active:scale-95 hover:bg-violet-50"
      >
        0
      </button>
      <button
        onClick={onDel}
        className="flex h-16 w-16 items-center justify-center rounded-2xl text-slate-500 transition active:scale-95 hover:bg-violet-50"
      >
        <Delete className="h-6 w-6" />
      </button>
    </div>
  );
}

export default function AppLock() {
  const [stage, setStage] = useState(null); // null | welcome | setPin | unlock
  const [unlocked, setUnlocked] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [setStep, setSetStep] = useState("enter");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [bioPrompt, setBioPrompt] = useState(false);

  useEffect(() => {
    const storedName = getStoredName();
    const storedPin = getStoredPin();
    if (!storedName) setStage("welcome");
    else if (!storedPin) setStage("setPin");
    else setStage("unlock");
    biometricAvailable().then(setBioSupported);
    setBioOn(biometricEnabled());
  }, []);

  // After any successful unlock, ask the browser once to keep this site's data
  // (PIN, wrapped keys, attachments) instead of clearing it when the device is
  // low on space. The result is ignored; browsers may silently say no.
  useEffect(() => {
    if (unlocked) requestPersistentStorage();
  }, [unlocked]);

  // Auto-lock: wipe the DEK and return to the PIN screen after 3 minutes of
  // inactivity, or immediately when the tab is backgrounded/hidden.
  useAutoLock(unlocked, () => {
    setUnlocked(false);
    setPin("");
    setConfirmPin("");
    setSetStep("enter");
    setError("");
  });

  function fail(msg) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setPin("");
    setConfirmPin("");
    setSetStep("enter");
  }

  async function press(d) {
    setError("");
    if (stage === "setPin") {
      if (setStep === "enter") {
        const next = (pin + d).slice(0, 4);
        setPin(next);
        if (next.length === 4) setSetStep("confirm");
      } else {
        const next = (confirmPin + d).slice(0, 4);
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) {
            try { localStorage.setItem(PIN_KEY, hashPin(next)); } catch {}
            setUnlocking(true);
            try { await setupNewPinEncryption(next); } catch {}
            setUnlocking(false);
            if (bioSupported && !biometricEnabled()) {
              setBioPrompt(true);
            } else {
              setUnlocked(true);
            }
          } else {
            fail("PINs don't match. Try again.");
          }
        }
      }
    } else {
      const next = (pin + d).slice(0, 4);
      setPin(next);
      if (next.length === 4) {
        if (hashPin(next) === getStoredPin()) {
          setUnlocking(true);
          try {
            if (hasWrappedDek()) {
              await unlockWithPin(next);
            } else {
              await setupNewPinEncryption(next);
            }
            await migrateLegacyAttachments().catch(() => {});
          } catch {}
          setUnlocking(false);
          if (hasSessionKey()) {
            setUnlocked(true);
          } else {
            setError("Couldn't unlock saved data. Reset your PIN to start fresh.");
            setShake(true);
            setTimeout(() => { setShake(false); setPin(""); setError(""); }, 900);
          }
        } else {
          setError("Incorrect PIN.");
          setShake(true);
          setTimeout(() => { setShake(false); setPin(""); setError(""); }, 500);
        }
      }
    }
  }

  function del() {
    setError("");
    if (stage === "setPin" && setStep === "confirm") setConfirmPin((p) => p.slice(0, -1));
    else setPin((p) => p.slice(0, -1));
  }

  function startWithName() {
    const n = name.trim();
    if (n.length < 1) { setError("Please enter your name"); return; }
    try { localStorage.setItem(NAME_KEY, n); } catch {}
    setError("");
    setStage("setPin");
  }

  async function setupBiometric() {
    setBusy(true); setError("");
    try {
      await enableBiometric();
      // Only create a key if none is loaded, so biometric and PIN share one DEK.
      if (!hasSessionKey()) await generateSessionDek();
      await enableBiometricEncryption();
      setBioOn(true);
      setUnlocked(true);
    } catch {
      setError("Biometric setup failed. Use a PIN instead.");
    } finally {
      setBusy(false);
    }
  }

  async function unlockBiometric() {
    setBusy(true); setError("");
    try {
      const ok = await biometricUnlock();
      if (ok) {
        const dekOk = await unlockWithBiometric().catch(() => false);
        if (dekOk) {
          await migrateLegacyAttachments().catch(() => {});
          setUnlocked(true);
        } else {
          setError("Biometric unlock failed. Enter your PIN.");
        }
      } else setError("Biometric unlock failed. Enter your PIN.");
    } catch {
      setError("Biometric unlock failed. Enter your PIN.");
    } finally {
      setBusy(false);
    }
  }

  // One-time prompt after first PIN setup: offer biometric as a recovery backup
  // so a forgotten PIN doesn't permanently lock the user out of their reports.
  async function enableBioBackup() {
    setBusy(true); setError("");
    try {
      await enableBiometric();
      await enableBiometricEncryption();
      setBioOn(true);
      setBioPrompt(false);
      setUnlocked(true);
    } catch {
      setError("Biometric setup was cancelled or failed. You can enable it later in Profile.");
    } finally {
      setBusy(false);
    }
  }

  function skipBioPrompt() {
    setBioPrompt(false);
    setUnlocked(true);
  }

  function resetPin() {
    if (!confirm("Reset your PIN? This creates a new encryption key. Attachments and saved reports on this device that were encrypted with the old key can no longer be opened. Continue?")) return;
    try { localStorage.removeItem(PIN_KEY); } catch {}
    clearWrappedDek();
    disableBiometric();
    setBioOn(false);
    setPin(""); setConfirmPin(""); setSetStep("enter"); setError("");
    setStage("setPin");
  }

  if (unlocking) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (bioPrompt) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-gradient-to-b from-violet-100 via-violet-50 to-background px-6 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
          <Fingerprint className="h-10 w-10 text-violet-600" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-slate-900">Enable biometric backup?</h1>
        <p className="mt-2 max-w-xs text-sm text-slate-500">
          If you ever forget your PIN, biometric unlock lets you back in without
          losing your reports. Your fingerprint or face becomes a recovery key.
        </p>
        {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
        <Button onClick={enableBioBackup} disabled={busy} className="mt-6 w-full max-w-xs rounded-2xl">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
          Enable biometric
        </Button>
        <button
          onClick={skipBioPrompt}
          disabled={busy}
          className="mt-3 text-sm text-slate-400 hover:text-slate-600 disabled:opacity-50"
        >
          Maybe later
        </button>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldAlert className="h-3 w-3" /> You can always turn this on in Profile.
        </p>
      </div>
    );
  }

  if (unlocked) return <Outlet />;

  if (stage === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const display = stage === "setPin" && setStep === "confirm" ? confirmPin : pin;

  // Welcome + name capture (first launch)
  if (stage === "welcome") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-gradient-to-b from-violet-100 via-violet-50 to-background px-6">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <SentinelLogo size="h-48 w-48" />
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mt-6 text-2xl font-semibold tracking-tight text-slate-900"
          >
            Hi{name.trim() ? ` ${name.trim()}` : ""}!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-2 max-w-xs text-sm text-slate-500"
          >
            This is Sentinel, your safe space for everything. You got this.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="pb-10"
        >
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            What's your name?
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startWithName()}
            placeholder="Enter your name"
            className="rounded-2xl"
            autoFocus
          />
          <Button onClick={startWithName} className="mt-3 w-full rounded-2xl">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        </motion.div>
      </div>
    );
  }

  // Set PIN (after name, or after reset)
  if (stage === "setPin") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-gradient-to-b from-violet-100 via-violet-50 to-background px-6 py-10 text-center">
        <SentinelLogo size="h-20 w-20" animate={false} />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Set your app PIN</h1>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          {setStep === "confirm" ? "Re-enter your PIN to confirm" : "Choose a 4-digit PIN to protect your reports"}
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
          <ShieldAlert className="h-3.5 w-3.5" /> Never share your PIN with anyone.
        </div>
        <Dots display={display} shake={shake} />
        {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}
        <Keypad onPress={press} onDel={del} />
        {bioSupported && (
          <button
            onClick={setupBiometric}
            disabled={busy}
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-violet-700 hover:text-violet-900 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
            Or use biometrics instead
          </button>
        )}
      </div>
    );
  }

  // Unlock (returning user)
  const firstName = (getStoredName() || "").split(" ")[0] || "there";
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-gradient-to-b from-violet-100 via-violet-50 to-background px-6 py-10 text-center">
      <SentinelLogo size="h-24 w-24" animate={false} />
      <h1 className="mt-4 text-xl font-semibold text-slate-900">Welcome back, {firstName}</h1>
      <p className="mt-1 text-sm text-slate-500">Enter your PIN to unlock</p>
      <Dots display={display} shake={shake} />
      {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}
      <Keypad onPress={press} onDel={del} />
      {bioOn && (
        <button
          onClick={unlockBiometric}
          disabled={busy}
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-violet-700 hover:text-violet-900 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
          Use biometrics
        </button>
      )}
      <button onClick={resetPin} className="mt-4 text-xs text-slate-400 hover:text-slate-600">
        Reset PIN
      </button>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }`}</style>
    </div>
  );
}