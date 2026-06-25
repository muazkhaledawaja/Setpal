"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import {
  AcceptInviteSchema,
  type AcceptInviteInput,
} from "@/modules/clients/clients.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInviteAction } from "./actions";

interface AcceptInviteFormProps {
  token: string;
  email: string;
  locale: string;
}

export function AcceptInviteForm({
  token,
  email,
  locale,
}: AcceptInviteFormProps) {
  const t = useTranslations("invite");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const safeLocale = (locale === "ar" ? "ar" : "en") as "ar" | "en";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(AcceptInviteSchema) as any,
    defaultValues: { token, locale: safeLocale, fullName: "", password: "" },
  });

  async function onSubmit(values: AcceptInviteInput) {
    setLoading(true);
    setServerError(null);

    const supabase = createClient();

    // 1. Sign up
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          role: "client",
          locale: values.locale,
        },
      },
    });

    if (signupError) {
      if (signupError.message.toLowerCase().includes("already")) {
        const { error: signinError } = await supabase.auth.signInWithPassword({
          email,
          password: values.password,
        });

        if (signinError) {
          setServerError(tCommon("genericError"));
          setLoading(false);
          return;
        }
      } else {
        setServerError(tCommon("genericError"));
        setLoading(false);
        return;
      }
    } else {
      // If sign up succeeded, sign in so the session cookie is available for the server action.
      const { error: signinError } = await supabase.auth.signInWithPassword({
        email,
        password: values.password,
      });

      if (signinError) {
        setServerError(tCommon("genericError"));
        setLoading(false);
        return;
      }
    }

    // 3. Accept invite via server action (now has a valid session cookie)
    const result = await acceptInviteAction(token);

    if (!result.ok) {
      setServerError(t("invalidToken"));
      setLoading(false);
      return;
    }

    router.push("/client");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card border border-border rounded-lg p-6 space-y-4"
    >
      <div className="space-y-2">
        <Label>{tCommon("email")}</Label>
        <Input value={email} disabled className="opacity-70" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">{tCommon("fullName")}</Label>
        <Input id="fullName" autoComplete="name" {...register("fullName")} />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{tCommon("password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? tCommon("loading") : t("createAccount")}
      </Button>
    </form>
  );
}
