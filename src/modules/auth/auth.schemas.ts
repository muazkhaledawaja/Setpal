import { z } from "zod";

export const RoleSchema = z.enum(["admin", "coach", "client"]);
export const LocaleSchema = z.enum(["ar", "en"]);

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Name too short").max(120),
  role: z.enum(["coach", "client"]), // admin is created out-of-band
  locale: LocaleSchema.default("ar"),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password required"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type Role = z.infer<typeof RoleSchema>;
