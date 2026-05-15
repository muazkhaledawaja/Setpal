"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Copy, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InviteClientSchema, type InviteClientInput } from "@/modules/clients/clients.schemas";

export function InviteForm({ locale }: { locale: string }) {
  const t = useTranslations("coach");
  const tCommon = useTranslations("common");

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteClientInput>({
    resolver: zodResolver(InviteClientSchema),
  });

  async function onSubmit(values: InviteClientInput) {
    setLoading(true);
    setServerError(null);
    setInviteUrl(null);

    const res = await fetch("/api/coach/clients/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-locale": locale,
      },
      body: JSON.stringify(values),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      const code = json?.error?.code;
      setServerError(
        code === "client_limit_reached"
          ? t("clients.errors.limitReached")
          : code === "invite_already_sent"
          ? t("clients.errors.alreadyInvited")
          : tCommon("genericError")
      );
      return;
    }

    setInviteUrl(json.inviteUrl);
    reset();
  }

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      // Fallback for HTTP (no clipboard API)
      const el = document.createElement("textarea");
      el.value = inviteUrl;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (inviteUrl) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-success/15 flex items-center justify-center">
            <Mail className="size-5 text-success" />
          </div>
          <div>
            <p className="font-medium">{t("clients.invitePage.sent.title")}</p>
            <p className="text-sm text-muted-foreground">{t("clients.invitePage.sent.subtitle")}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("clients.invitePage.sent.linkLabel")}</Label>
          <div className="flex gap-2">
            <Input value={inviteUrl} readOnly className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0">
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("clients.invitePage.sent.expiry")}</p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setInviteUrl(null)}
        >
          {t("clients.invitePage.sent.inviteAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{tCommon("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="client@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? tCommon("loading") : t("clients.invitePage.send")}
      </Button>
    </form>
  );
}
