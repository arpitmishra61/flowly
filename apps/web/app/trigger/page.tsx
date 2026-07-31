"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";

const WEBHOOK_STORAGE_KEY = "flowly_trigger_webhook_url";

interface Contact {
  id: number;
  name: string;
  email: string;
}

export default function TriggerPage() {
  const { data: session } = useSession();
  const email = session?.user?.email ?? "";
  const name = session?.user?.name ?? "";

  const [repo, setRepo] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(WEBHOOK_STORAGE_KEY);
    if (saved) setWebhookUrl(saved);
  }, []);

  useEffect(() => {
    if (!email) return;
    apiFetch(`/api/v1/contacts`)
      .then((res) => res.json())
      .then((data) => setContacts(data.contacts || []))
      .catch(() => setContacts([]));
  }, [email]);

  const handleWebhookChange = (value: string) => {
    setWebhookUrl(value);
    localStorage.setItem(WEBHOOK_STORAGE_KEY, value);
  };

  const handleTrigger = async () => {
    if (!webhookUrl.trim()) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch(webhookUrl.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: { name, email },
          repo: repo.trim(),
          title: title.trim(),
          description: description.trim(),
        }),
      });

      setResult(
        res.ok
          ? { ok: true, message: "Webhook triggered successfully." }
          : { ok: false, message: `Webhook responded with status ${res.status}.` }
      );
    } catch (e: any) {
      setResult({ ok: false, message: e.message || "Failed to reach webhook." });
    } finally {
      setSending(false);
    }
  };

  const canSend = !!webhookUrl.trim() && !!repo.trim() && !!title.trim() && !sending;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trigger Webhook</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the details below and trigger your Zap's webhook directly.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
          <CardDescription>
            Paste the webhook URL your Zap listens on. Saved locally in this browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="https://..."
            value={webhookUrl}
            onChange={(e) => handleWebhookChange(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bug Report</CardTitle>
          <CardDescription>{email ? `Sending as ${name} (${email})` : "Sign in required"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Repo <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Repo name"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="dummy bug"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="there is testing repo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Receiver Name</label>
            <select
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
            >
              <option value="">Select a contact</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
            {contacts.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                No contacts yet — add some in Settings.
              </p>
            )}
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                result.ok
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {result.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          <Button onClick={handleTrigger} disabled={!canSend} className="w-full" size="lg">
            {sending ? "Triggering..." : "Trigger Webhook"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
