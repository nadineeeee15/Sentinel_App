import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Lock, Delete, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const PIN_KEY = "cybersec_app_pin";

function hashPin(pin) {
  let h = 5381;
  for (let i = 0; i < pin.length; i++) h = (h * 33) + pin.charCodeAt(i);
  return String(h >>> 0);
}

function getStoredPin() {
  try { return localStorage.getItem(PIN_KEY); } catch { return null; }
}

function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 22) return "Good evening";
  return "Good night";
}

export default function AppLock() {
  const [unlocked, setUnlocked] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [stage, setStage] = useState("enter"); // enter | confirm
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setNeedsSetup(!getStoredPin());
  }, []);

  function fail(msg) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setPin("");
    setConfirmPin("");
    setStage("enter");
  }

  function press(d) {
    setError("");
    if (needsSetup) {
      if (stage === "enter") {
        const next = (pin + d).slice(0, 4);
        setPin(next);
        if (next.length === 4) setStage("confirm");
      } else {
        const next = (confirmPin + d).slice(0, 4);
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) {
            try { localStorage.setItem(PIN_KEY, hashPin(next)); } catch {}
            setUnlocked(true);
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
          setUnlocked(true);
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
    if (needsSetup && stage === "confirm") {
      setConfirmPin((p) => p.slice(0, -1));
    } else {
      setPin((p) => p.slice(0, -1));
    }
  }

  function resetPin() {
    if (!confirm("Reset the app PIN? You'll need to set a new one to unlock.")) return;
    try { localStorage.removeItem(PIN_KEY); } catch {}
    setNeedsSetup(true);
    setStage("enter");
    setPin("");
    setConfirmPin("");
    setError("");
  }

  if (unlocked) return <Outlet />;

  const display = needsSetup ? (stage === "confirm" ? confirmPin : pin) : pin;
  const title = needsSetup
    ? stage === "confirm" ? "Confirm your PIN" : "Create an app PIN"
    : "Welcome back";
  const subtitle = needsSetup
    ? stage === "confirm" ? "Re-enter the 4 digits to confirm"
      : "Set a 4-digit PIN to lock your reports for safety"
    : `${greeting()} — enter your PIN to unlock`;

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-gradient-to-b from-violet-100 via-violet-50 to-background px-6 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-violet-500/30">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 max-w-xs text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className={cn("flex gap-3", shake && "animate-[shake_0.4s]")}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-3.5 w-3.5 rounded-full border-2 transition",
              i < display.length
                ? "border-primary bg-primary"
                : "border-slate-300 bg-transparent"
            )}
          />
        ))}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}

      <div className="mt-8 grid grid-cols-3 gap-3">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-semibold text-slate-800 shadow-sm transition active:scale-95 hover:bg-violet-50"
          >
            {k}
          </button>
        ))}
        <button
          onClick={resetPin}
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          {needsSetup ? "" : "Reset"}
        </button>
        <button
          onClick={() => press("0")}
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-semibold text-slate-800 shadow-sm transition active:scale-95 hover:bg-violet-50"
        >
          0
        </button>
        <button
          onClick={del}
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-slate-500 transition active:scale-95 hover:bg-violet-50"
        >
          <Delete className="h-6 w-6" />
        </button>
      </div>

      <div className="mt-8 flex items-center gap-1.5 text-xs text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5 text-violet-500" />
        Your reports are protected by an app PIN stored only on this device.
      </div>

      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }`}</style>
    </div>
  );
}