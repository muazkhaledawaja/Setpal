import { z } from "zod";

export const LocaleSchema = z.enum(["ar", "en"]);

// No .transform() here: react-hook-form needs the resolver's input and output
// types to match. Empty-string → null normalization happens in the service.
export const UpdateProfileSchema = z.object({
  full_name: z.string().min(2, "Name too short").max(120),
  phone: z.string().max(30).optional(),
  locale: LocaleSchema,
  avatar_url: z.string().url().nullable().optional(),
});

export const UpdateCoachProfileSchema = z.object({
  bio_ar: z.string().max(2000).optional(),
  bio_en: z.string().max(2000).optional(),
  specializations: z.array(z.string().min(1).max(60)).max(20).default([]),
});

export const ChangePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdateCoachProfileInput = z.input<typeof UpdateCoachProfileSchema>;
export type UpdateCoachProfileValues = z.output<typeof UpdateCoachProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
