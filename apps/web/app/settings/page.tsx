"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

const API = "http://localhost:5001";

interface Contact {
  id: number;
  name: string;
  email: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const email = session?.user?.email;

  const [password, setPassword] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState("");

  const [hookId, setHookId] = useState("");
  const [savedHookId, setSavedHookId] = useState("");
  const [hookSaving, setHookSaving] = useState(false);
  const [hookError, setHookError] = useState("");
  const [hookSuccess, setHookSuccess] = useState(false);

  const loadContacts = () => {
    if (!email) return;
    fetch(`${API}/api/v1/contacts?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => setContacts(data.contacts || []))
      .catch(() => setContacts([]));
  };

  useEffect(() => {
    if (!email) return;
    fetch(`${API}/api/v1/user/google-secret/status?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => setConfigured(!!data.configured))
      .catch(() => setConfigured(null));
  }, [email]);

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  useEffect(() => {
    if (!email) return;
    fetch(`${API}/api/v1/user/hook-id?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => setSavedHookId(data.hookId || ""))
      .catch(() => setSavedHookId(""));
  }, [email]);

  const handleAddContact = async () => {
    if (!email || !contactName.trim() || !contactEmail.trim()) return;
    setContactSaving(true);
    setContactError("");
    try {
      const res = await fetch(`${API}/api/v1/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: contactName.trim(),
          contactEmail: contactEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to add contact");
      }
      setContactName("");
      setContactEmail("");
      loadContacts();
    } catch (e: any) {
      setContactError(e.message || "Failed to add contact");
    } finally {
      setContactSaving(false);
    }
  };

  const handleSaveHookId = async () => {
    if (!email || !hookId.trim()) return;
    setHookSaving(true);
    setHookError("");
    setHookSuccess(false);
    try {
      const res = await fetch(`${API}/api/v1/user/hook-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, hookId: hookId.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save Hook ID");
      }
      setSavedHookId(data.hookId);
      setHookSuccess(true);
      setHookId("");
    } catch (e: any) {
      setHookError(e.message || "Failed to save Hook ID");
    } finally {
      setHookSaving(false);
    }
  };

  const handleSave = async () => {
    if (!email || !password.trim()) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`${API}/api/v1/user/google-secret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, googleSecret: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save password");
      }
      setConfigured(true);
      setSuccess(true);
      setPassword("");
    } catch (e: any) {
      setError(e.message || "Failed to save password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the Gmail App Password Flowly uses to send mail on your behalf.
        </p>
      </div>

      {configured !== null && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            configured
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}
        >
          {configured ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span>
            {configured
              ? "Google App Password is configured. Gmail actions can send mail."
              : "No Google App Password configured yet. Gmail actions will fail until you add one below."}
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How to get a Google App Password</CardTitle>
          <CardDescription>
            App Passwords let Flowly send mail through your Gmail account without your real password.
            This requires 2-Step Verification to be enabled on your Google account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              Go to{" "}
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                Google Account &rarr; Security
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Under "How you sign in to Google", enable <strong>2-Step Verification</strong> if it isn't already on.</li>
            <li>
              Go to{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                Google Account &rarr; App Passwords
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Enter a name (e.g. "Flowly") and click <strong>Create</strong>.</li>
            <li>Google will show a 16-character password (e.g. <code>abcd efgh ijkl mnop</code>). Copy it.</li>
            <li>Paste it into the field below and click <strong>Save</strong>. You won't be able to view it again after this, so keep it handy until it's saved.</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google App Password</CardTitle>
          <CardDescription>
            {email ? `For ${email}` : "Sign in to configure your app password"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            placeholder="Paste your 16-character app password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!email || saving}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Saved successfully.</p>}
          <Button
            onClick={handleSave}
            disabled={!email || !password.trim() || saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Chat Hook</CardTitle>
          <CardDescription>
            {savedHookId
              ? `Hook ID configured: ${savedHookId}`
              : "Enter the Hook ID the AI chat assistant should send drafted mails to."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Hook ID"
            value={hookId}
            onChange={(e) => setHookId(e.target.value)}
            disabled={!email || hookSaving}
          />
          {hookError && <p className="text-sm text-destructive">{hookError}</p>}
          {hookSuccess && <p className="text-sm text-green-600">Saved successfully.</p>}
          <Button
            onClick={handleSaveHookId}
            disabled={!email || !hookId.trim() || hookSaving}
          >
            {hookSaving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            Add people Flowly can send mail to on your behalf by name.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contacts.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {contacts.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{c.email}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              disabled={!email || contactSaving}
            />
            <Input
              type="email"
              placeholder="Email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={!email || contactSaving}
            />
            <Button
              onClick={handleAddContact}
              disabled={!email || !contactName.trim() || !contactEmail.trim() || contactSaving}
            >
              {contactSaving ? "Adding..." : "Add"}
            </Button>
          </div>
          {contactError && <p className="text-sm text-destructive">{contactError}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
