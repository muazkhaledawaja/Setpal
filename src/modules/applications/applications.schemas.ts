import { z } from "zod";

export const APPLICATION_STATUSES = ["new", "contacted", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const CoachApplicationSchema = z.object({
  full_name: z.string().min(2, "Name too short").max(120),
  email: z.string().email("Invalid email"),
  phone: z.string().min(7, "Phone too short").max(20),
  city: z.string().min(2, "City too short").max(80),
  specialty: z.enum(["fitness", "nutrition", "both"]),
  client_count: z.coerce.number().int().min(0).max(10000),
});

export const AdminApplicationUpdateSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  admin_notes: z.string().max(2000).optional(),
});

export type CoachApplicationInput = z.infer<typeof CoachApplicationSchema>;
export type AdminApplicationUpdateInput = z.infer<typeof AdminApplicationUpdateSchema>;
