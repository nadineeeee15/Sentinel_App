import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Fingerprint, KeyRound, LogOut, Lock, ShieldCheck, Trash2, Loader2, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import {
  biometricAvailable, enableBiometric, biometricEnabled, disableBiometric,
} from "@/lib/biometric";
import { setStoredPin, PIN_KEY } from "@/lib/pin";
import {
  setupNewPinEncryption, changePinEncryption, hasWrappedDek, hasSessionKey,
  enableBiometricEncryption, removeBiometricWrappedDek, clearWrappedDek, clearSessionKey,
} from "@/lib/crypto";
import PinSetter from "@/components/security/PinSetter";
import ThemeToggle from "@/components/ThemeToggle";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { clearAllAttachments } from "@/lib/attachments";
import { hasAiConsent, setAiConsent } from "@/lib/aiConsent";

const NAME_KEY = "sentinel_user_name";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [bioSupported, setBioSupported] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [bioMsg, setBioMsg] = useState("");
  const [settingPin, setSettingPin] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [aiOn, setAiOn] = useState(hasAiConsent);
  const { toast } = useToast();

  function toggleAi(on) {
    setAiConsent(on);
    setAiOn(on);
  }

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
    setBioMsg("");
    try {
      if (on) {
        await enableBiometric();
        if (hasSessionKey()) await enableBiometricEncryption().catch(() => {});
        setBioOn(true);
        setBioMsg("Biometric unlock enabled.");
      } else {
        disableBiometric();
        removeBiometricWrappedDek();
        setBioOn(false);
        setBioMsg("Biometric unlock disabled.");
      }
    } catch (e) {
      setBioOn(false);
      setBioMsg(e?.message || "Biometric is unavailable here. Use your PIN instead.");
    } finally {
      setBusy(false);
    }
  }

  function changePin() {
    setMsg("");
    setSettingPin(true);
  }

  async function saveNewPin(pin) {
    setStoredPin(pin);
    setPinSet(true);
    setSettingPin(false);
    setMsg("Your PIN has been changed.");
    toast({ title: "Your PIN has been changed." });
    try {
      if (hasWrappedDek() && hasSessionKey()) {
        await changePinEncryption(pin);
      } else if (!hasWrappedDek()) {
        await setupNewPinEncryption(pin);
        if (bioOn) await enableBiometricEncryption().catch(() => {});
      }
    } catch {}
  }

  async function signOut() {
    clearSessionKey();
    await base44.auth.logout();
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      if (user?.id) {
        try {
          await base44.entities.Incident.deleteMany({ created_by_id: user.id });
        } catch {}
      }
      await clearAllAttachments().catch(() => {});
      clearWrappedDek();
      clearSessionKey();
      disableBiometric();
      try { localStorage.removeItem(PIN_KEY); } catch {}
      try { localStorage.removeItem(NAME_KEY); } catch {}
      await base44.auth.logout("/login");
    } catch {
      setDeleting(false);
    }
  }

  const localName =
    (typeof localStorage !== "undefined" && localStorage.getItem(NAME_KEY)) || "";
  const displayName = user?.full_name || localName || "Sentinel user";
  const email = user?.email || "";

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-24 text-foreground">
      <header className="flex items-center justify-between px-5 pb-3 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile</h1>
        <ThemeToggle />
      </header>

      <main className="space-y-6 px-5">
        {/* Identity */}
        <section className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <User className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-card-foreground">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">{email || "Signed-in user"}</p>
          </div>
        </section>

        {/* Security */}
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Security
          </h2>
          <div className="divide-y divide-border rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-card-foreground">App lock PIN</p>
                  <p className="text-sm text-muted-foreground">
                    {pinSet ? "PIN set" : "No PIN set"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" onClick={changePin}>
                {pinSet ? "Change" : "Set PIN"}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-card-foreground">Biometric unlock</p>
                  <p className="text-sm text-muted-foreground">
                    {bioSupported ? "Face / Fingerprint" : "Unavailable in this browser"}
                  </p>
                </div>
              </div>
              {bioSupported ? (
                <Switch checked={bioOn} disabled={busy} onCheckedChange={toggleBio} />
              ) : (
                <span className="text-sm font-medium text-muted-foreground/60">N/A</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-card-foreground">AI summaries</p>
                  <p className="text-sm text-muted-foreground">
                    {aiOn ? "Allowed. Report text only, never photos" : "Asks before sending anything"}
                  </p>
                </div>
              </div>
              <Switch checked={aiOn} onCheckedChange={toggleAi} aria-label="Allow AI summaries" />
            </div>
          </div>

          {bioMsg && <p className="mt-2 px-1 text-sm text-muted-foreground">{bioMsg}</p>}

          {settingPin && (
            <div className="mt-3 rounded-2xl border border-border bg-card p-4">
              <PinSetter onDone={saveNewPin} onCancel={() => setSettingPin(false)} />
            </div>
          )}
        </section>

        {/* Account */}
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </h2>
          <div className="divide-y divide-border rounded-2xl border border-border bg-card">
            <Link to="/forgot-password" className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium text-card-foreground">Change password</p>
              </div>
              <span className="text-sm text-muted-foreground">Via email reset</span>
            </Link>
            <button onClick={signOut} className="flex w-full items-center gap-3 p-4 text-left">
              <LogOut className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-rose-600">Sign out</p>
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <Trash2 className="h-5 w-5 text-rose-600" />
              <p className="text-sm font-medium text-rose-600">Delete account</p>
            </button>
          </div>
        </section>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes all your encrypted reports, local attachments, and saved
                credentials from this device, and deletes your incident records from your
                account. This can't be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={deleteAccount} disabled={deleting}>
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {deleting ? "Deleting…" : "Delete account"}
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex items-start gap-2 rounded-2xl bg-primary/10 p-3 text-sm text-primary">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Your app lock and biometric settings are stored only on this device.</p>
        </div>

        {msg && <p className="text-center text-sm text-muted-foreground">{msg}</p>}
      </main>
    </div>
  );
}