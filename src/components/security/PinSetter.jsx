import React, { useState } from "react";
import { Delete, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// Inline 4-digit PIN setter (enter + confirm). Calls onDone(pin) when the
// two entries match, or onCancel() to dismiss.
export default function PinSetter({ onDone, onCancel }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState("enter");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  function fail(msg) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setPin("");
    setConfirm("");
    setStep("enter");
  }

  function press(d) {
    setError("");
    if (step === "enter") {
      const next = (pin + d).slice(0, 4);
      setPin(next);
      if (next.length === 4) setStep("confirm");
    } else {
      const next = (confirm + d).slice(0, 4);
      setConfirm(next);
      if (next.length === 4) {
        if (next === pin) onDone?.(next);
        else fail("PINs don't match. Try again.");
      }
    }
  }

  function del() {
    setError("");
    if (step === "confirm") setConfirm((p) => p.slice(0, -1));
    else setPin((p) => p.slice(0, -1));
  }

  const display = step === "confirm" ? confirm : pin;

  return (
    <div className="flex flex-col items-center text-center">
      <h3 className="text-base font-semibold text-slate-900">
        {step === "confirm" ? "Re-enter your new PIN" : "Set a new 4-digit PIN"}
      </h3>
      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
        <ShieldAlert className="h-3.5 w-3.5" /> Never share your PIN with anyone.
      </div>
      <div className={cn("mt-4 flex gap-3", shake && "animate-[shake_0.4s]")}>
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
      {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-800 shadow-sm transition active:scale-95 hover:bg-violet-50"
          >
            {k}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => press("0")}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-800 shadow-sm transition active:scale-95 hover:bg-violet-50"
        >
          0
        </button>
        <button
          type="button"
          onClick={del}
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-slate-500 transition active:scale-95 hover:bg-violet-50"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="mt-4 text-xs text-slate-400 hover:text-slate-600"
      >
        Cancel
      </button>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }`}</style>
    </div>
  );
}