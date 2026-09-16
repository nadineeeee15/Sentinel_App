import React from "react";
import {
  Eye, MessageSquare, MessageCircle, AlertTriangle, House, Flag,
  ImageOff, Globe, Fingerprint, ShieldAlert, Fish, CircleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const CATEGORIES = [
  { value: "stalking", label: "Stalking", icon: Eye },
  { value: "harassment", label: "Harassment", icon: MessageSquare },
  { value: "cyberbullying", label: "Cyberbullying", icon: MessageCircle },
  { value: "threats", label: "Threats", icon: AlertTriangle },
  { value: "domestic_abuse", label: "Domestic Abuse", icon: House },
  { value: "hate_speech", label: "Hate Speech", icon: Flag },
  { value: "image_based_abuse", label: "Image-Based Abuse", icon: ImageOff },
  { value: "doxxing", label: "Doxxing", icon: Globe },
  { value: "identity_theft", label: "Identity Theft", icon: Fingerprint },
  { value: "online_fraud", label: "Online Fraud", icon: ShieldAlert },
  { value: "phishing", label: "Phishing", icon: Fish },
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
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
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