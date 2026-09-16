import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SEVERITIES = ["low", "medium", "high", "critical"];
const CATEGORIES = ["safety", "security", "environmental", "equipment", "personnel", "other"];

function toLocalInput(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function IncidentForm({ incident, onSaved, onCancel }) {
  const editing = Boolean(incident?.id);
  const [title, setTitle] = useState(incident?.title ?? "");
  const [description, setDescription] = useState(incident?.description ?? "");
  const [severity, setSeverity] = useState(incident?.severity ?? "medium");
  const [category, setCategory] = useState(incident?.category ?? "other");
  const [location, setLocation] = useState(incident?.location ?? "");
  const [incidentDate, setIncidentDate] = useState(
    toLocalInput(incident?.incident_date) || toLocalInput(new Date().toISOString())
  );
  const [photoUrl, setPhotoUrl] = useState(incident?.photo_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handlePhoto(file) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setPhotoUrl(file_url);
    } catch (e) {
      setError("Could not upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    if (!incidentDate) {
      setError("Please set when the incident happened.");
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      severity,
      category,
      location: location.trim(),
      incident_date: new Date(incidentDate).toISOString(),
      photo_url: photoUrl || undefined,
    };
    try {
      let saved;
      if (editing) {
        saved = await base44.entities.Incident.update(incident.id, payload);
      } else {
        saved = await base44.entities.Incident.create(payload);
      }
      onSaved?.(saved);
    } catch (e) {
      setError(e?.message || "Could not save the incident.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Spilled oil near loading bay"
          maxLength={120}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Severity</Label>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Building, area, or address"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="incident_date">When it happened</Label>
        <Input
          id="incident_date"
          type="datetime-local"
          value={incidentDate}
          onChange={(e) => setIncidentDate(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what happened, any witnesses, immediate actions taken…"
          rows={4}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Photo</Label>
        {photoUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-slate-200">
            <img src={photoUrl} alt="Incident" className="h-40 w-full object-cover" />
            <button
              type="button"
              onClick={() => setPhotoUrl("")}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 transition hover:bg-slate-100">
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
            ) : (
              <><Camera className="h-4 w-4" /> Add a photo</>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />
          </label>
        )}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={saving || uploading}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save changes" : "Log incident"}
        </Button>
      </div>
    </form>
  );
}