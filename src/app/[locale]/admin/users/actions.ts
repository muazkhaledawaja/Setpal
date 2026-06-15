"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AdminService } from "@/modules/admin/admin.service";
import { UserRoleSchema, UserStatusSchema } from "@/modules/admin/admin.schemas";

export async function approveUserAction(userId: string, role: string) {
  const parsed = UserRoleSchema.parse(role);
  const supabase = await createClient();
  await new AdminService(supabase).approveUser(userId, parsed);
  revalidatePath("/[locale]/admin/users", "page");
}

export async function setStatusAction(userId: string, status: string) {
  const parsed = UserStatusSchema.parse(status);
  const supabase = await createClient();
  await new AdminService(supabase).setStatus(userId, parsed);
  revalidatePath("/[locale]/admin/users", "page");
}

export async function deleteUserAction(userId: string) {
  const supabase = await createClient();
  await new AdminService(supabase).deleteUser(userId);
  revalidatePath("/[locale]/admin/users", "page");
}
