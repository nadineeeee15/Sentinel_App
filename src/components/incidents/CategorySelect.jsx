import React from "react";
import {
  Fish, Bug, Lock, Database, KeyRound, Users, Network,
  UserX, UserMinus, Fingerprint, ShieldAlert, CircleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const CATEGORIES = [
  { value: "phishing", label: "Phishing", icon: Fish },
  { value: "malware", label: "Malware", icon: Bug },
  { value: "ransomware", label: "Ransomware", icon: Lock },
  { value: "data_breach", label: "Data Breach", icon: Database },
  { value: "unauthorized_access", label: "Unauthorized Access", icon: KeyRound },
  { value: "social_engineering", label: "Social Engineering", icon: Users },
  { value: "ddos", label: "DDoS Attack", icon: Network },
  { value: "account_compromise", label: "Account Compromise", icon: UserX },
  { value: "insider_threat", label: "Insider Threat", icon: UserMinus },
  { value: "identity_theft", label: "Identity Theft", icon: Fingerprint },
  { value: "online_fraud", label: "Online Fraud", icon: ShieldAlert },
  { value: "other", label: "Other", icon: CircleAlert },
];

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

export default function CategorySelect({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {CATEGORIES.map(({ value: v, label, icon: Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition active:scale-[0.98]",
              active
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[11px] font-medium leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}