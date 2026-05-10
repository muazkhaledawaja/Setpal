"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { RegisterSchema, type RegisterInput } from "@/modules/auth/auth.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({ locale }: { locale: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      role: "coach",
      locale: locale === "ar" ? "ar" : "en",
    },
  });

  const selectedRole = watch("role");

  async function onSubmit(values: RegisterInput) {
    setLoading(true);
    setServerError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          role: values.role,
          locale: values.locale,
        },
      },
    });

    if (error) {
      setServerError(
        error.message.toLowerCase().includes("already")
          ? t("errors.emailInUse")
          : t("errors.generic")
      );
      setLoading(false);
      return;
    }

    if (!data.session) {
      // Email confirmation required
      setNeedsConfirm(true);
      setLoading(false);
      return;
    }

    const target = values.role === "coach" ? "/coach" : "/client";
    router.push(target);
    router.refresh();
  }

  if (needsConfirm) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <p>{t("auth.checkEmail")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>{t("auth.iAmA")}</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setValue("role", "coach")}
            className={`p-3 rounded-md border text-sm transition ${
              selectedRole === "coach"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-accent"
            }`}
          >
            {t("auth.coach")}
          </button>
          <button
            type="button"
            onClick={() => setValue("role", "client")}
            className={`p-3 rounded-md border text-sm transition ${
              selectedRole === "client"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-accent"
            }`}
          >
            {t("auth.client")}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">{t("common.fullName")}</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("common.email")}</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("common.password")}</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("common.loading") : t("auth.createAccount")}
      </Button>
    </form>
  );
}
