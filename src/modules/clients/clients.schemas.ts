import { z } from "zod";

export const InviteClientSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const UpdateClientStatusSchema = z.object({
  clientId: z.string().uuid(),
  status: z.enum(["active", "paused", "ended"]),
});

export const AcceptInviteSchema = z.object({
  token: z.string().min(1),
  fullName: z.string().min(2, "Name too short").max(120),
  password: z.string().min(8, "Password must be at least 8 characters"),
  locale: z.enum(["ar", "en"]),
});

export type InviteClientInput = z.infer<typeof InviteClientSchema>;
export type UpdateClientStatusInput = z.infer<typeof UpdateClientStatusSchema>;
export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>;
