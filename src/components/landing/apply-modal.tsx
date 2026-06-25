"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { CheckCircle2, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CoachApplicationSchema,
  type CoachApplicationInput,
} from "@/modules/applications/applications.schemas";

interface ApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplyModal({ open, onOpenChange }: ApplyModalProps) {
  const t = useTranslations("applications");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CoachApplicationInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CoachApplicationSchema) as any,
    defaultValues: { specialty: "fitness", client_count: 0 },
  });

  async function onSubmit(values: CoachApplicationInput) {
    setServerError(null);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      setServerError(t("errors.generic"));
      return;
    }
    setSubmitted(true);
  }

  function handleClose(open: boolean) {
    if (!open) {
      // Reset after close animation finishes
      setTimeout(() => { setSubmitted(false); reset(); setServerError(null); }, 300);
    }
    onOpenChange(open);
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("مرحبًا، أريد معرفة المزيد عن سيتبال")}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="text-success" size={48} strokeWidth={1.5} />
            <DialogHeader>
              <DialogTitle>{t("success.title")}</DialogTitle>
              <DialogDescription>{t("success.message")}</DialogDescription>
            </DialogHeader>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-btn lp-btn-primary lp-btn-lg inline-flex items-center gap-2"
            >
              <MessageCircle size={18} />
              {t("success.whatsapp")}
            </a>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("modal.title")}</DialogTitle>
              <DialogDescription>{t("modal.subtitle")}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label htmlFor="am-fullName">{t("fields.fullName")}</Label>
                <Input id="am-fullName" {...register("full_name")} />
                {errors.full_name && (
                  <p className="text-xs text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="am-email">{t("fields.email")}</Label>
                <Input id="am-email" type="email" autoComplete="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="am-phone">{t("fields.phone")}</Label>
                <Input
                  id="am-phone"
                  type="tel"
                  placeholder={t("fields.phonePlaceholder")}
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="am-city">{t("fields.city")}</Label>
                <Input id="am-city" {...register("city")} />
                {errors.city && (
                  <p className="text-xs text-destructive">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("fields.specialty")}</Label>
                <div className="flex gap-3">
                  {(["fitness", "nutrition", "both"] as const).map((s) => (
                    <label key={s} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input type="radio" value={s} {...register("specialty")} className="accent-primary" />
                      {t(`fields.specialty${s.charAt(0).toUpperCase() + s.slice(1)}` as "fields.specialtyFitness")}
                    </label>
                  ))}
                </div>
                {errors.specialty && (
                  <p className="text-xs text-destructive">{errors.specialty.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="am-clients">{t("fields.clientCount")}</Label>
                <Input
                  id="am-clients"
                  type="number"
                  min={0}
                  placeholder={t("fields.clientCountPlaceholder")}
                  {...register("client_count")}
                />
                {errors.client_count && (
                  <p className="text-xs text-destructive">{errors.client_count.message}</p>
                )}
              </div>

              {serverError && <p className="text-sm text-destructive">{serverError}</p>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("submitting") : t("submit")}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
