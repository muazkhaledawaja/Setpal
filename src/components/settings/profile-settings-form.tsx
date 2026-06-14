"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { ProfileService } from "@/modules/profile";
import { StorageService } from "@/modules/storage/storage.service";
import {
  UpdateProfileSchema,
  type UpdateProfileInput,
} from "@/modules/profile/profile.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  userId: string;
  locale: string;
  email: string;
  initial: {
    full_name: string | null;
    phone: string | null;
    locale: "ar" | "en";
    avatar_url: string | null;
  };
}

export function ProfileSettingsForm({ userId, locale, email, initial }: Props) {
  const t = useTranslations("settings.profile");
  const router = useRouter();
  const pathname = usePathname();
  const fileInput = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [uploading, setUploading] = useState(false);

  const [selectedLocale, setSelectedLocale] = useState<"ar" | "en">(
    initial.locale
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      full_name: initial.full_name ?? "",
      phone: initial.phone ?? "",
      locale: initial.locale,
      avatar_url: initial.avatar_url,
    },
  });

  const initials = (initial.full_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await new StorageService().uploadAvatar(userId, file);
      setAvatarUrl(url);
      setValue("avatar_url", url, { shouldDirty: true });
    } catch {
      toast.error(t("avatarError"));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function onSubmit(values: UpdateProfileInput) {
    try {
      const service = new ProfileService(createClient());
      const updated = await service.updateProfile(
        userId,
        UpdateProfileSchema.parse(values)
      );
      toast.success(t("saved"));
      // If the language preference changed, switch the app to that locale.
      if (updated.locale && updated.locale !== locale) {
        router.replace(pathname, { locale: updated.locale });
      } else {
        router.refresh();
      }
    } catch {
      toast.error(t("saveError"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="size-16">
                <AvatarImage src={avatarUrl ?? undefined} alt={initial.full_name ?? ""} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
              >
                <Camera className="size-4 me-2" />
                {t("uploadAvatar")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("avatarHint")}</p>
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={onAvatarChange}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t("fullName")}</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input id="phone" type="tel" dir="ltr" {...register("phone")} />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" value={email} disabled dir="ltr" />
              <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
            </div>

            <div className="space-y-2">
              <Label>{t("locale")}</Label>
              <Select
                value={selectedLocale}
                onValueChange={(v) => {
                  setSelectedLocale(v as "ar" | "en");
                  setValue("locale", v as "ar" | "en", { shouldDirty: true });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">{t("languageAr")}</SelectItem>
                  <SelectItem value="en">{t("languageEn")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || uploading}>
            {isSubmitting && <Loader2 className="size-4 me-2 animate-spin" />}
            {t("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
