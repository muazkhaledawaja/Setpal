import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "coach", "client"]);
export const UserStatusSchema = z.enum(["pending", "active", "suspended"]);

export const ListUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
});

export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;

export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  role: z.infer<typeof UserRoleSchema>;
  status: z.infer<typeof UserStatusSchema>;
  locale: "ar" | "en";
  created_at: string;
  last_sign_in: string | null;
  client_count: number;
}
