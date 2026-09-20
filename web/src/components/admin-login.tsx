"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", password }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(typeof d.error === "string" ? d.error : "login failed");
      setBusy(false);
    }
  }

  return (
    <Panel title="admin" className="max-w-md">
      <form onSubmit={submit} className="space-y-3 p-4">
        <label className="block text-xs text-[var(--color-fg-dim)]" htmlFor="pw">
          Admin password
        </label>
        <Input
          id="pw"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
        />
        {error && <p className="text-sm text-[var(--color-red)]">✗ {error}</p>}
        <Button type="submit" disabled={busy || !password}>
          {busy ? "Checking…" : "Sign in"}
        </Button>
      </form>
    </Panel>
  );
}
