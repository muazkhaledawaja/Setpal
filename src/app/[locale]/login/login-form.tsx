"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { LoginSchema, type LoginInput } from "@/modules/auth/auth.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    setServerError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword(values);

    if (error || !data.user) {
      setServerError(t("errors.invalidCredentials"));
      setLoading(false);
      return;
    }

    // Fetch role + status to redirect appropriately. Unapproved or suspended
    // accounts go to /pending regardless of role.
    const { data: profile } = (await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .single()) as {
      data: {
        role: "admin" | "coach" | "client";
        status: "pending" | "active" | "suspended";
      } | null;
    };

    const target =
      profile?.status !== "active"
        ? "/pending"
        : profile.role === "admin"
        ? "/admin"
        : profile.role === "coach"
        ? "/coach"
        : "/client";

    router.push(target);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("common.email")}</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("common.password")}</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="text-end">
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          {t("auth.forgotPassword")}
        </Link>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("common.loading") : t("common.signIn")}
      </Button>
    </form>
  );
}
