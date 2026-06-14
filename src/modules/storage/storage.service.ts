import { createClient } from "@/lib/supabase/browser";

export class StorageService {
  private supabase = createClient();

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error } = await this.supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (error) throw new Error(error.message);

    const { data } = this.supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async uploadFormFile(
    clientId: string,
    questionId: string,
    file: File
  ): Promise<{ path: string; name: string; mime: string; size: number }> {
    // The storage RLS INSERT policy requires the first path segment to equal
    // auth.uid() (the uploading client). We use questionId in the path because
    // the response record doesn't exist yet at upload time.
    const path = `${clientId}/${questionId}/${Date.now()}_${file.name}`;

    const { error } = await this.supabase.storage
      .from("form-files")
      .upload(path, file);

    if (error) throw new Error(error.message);

    return {
      path,
      name: file.name,
      mime: file.type,
      size: file.size,
    };
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);
    if (error) throw new Error(error.message);
  }

  async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from("form-files")
      .createSignedUrl(path, 3600);
    if (error) throw new Error(error.message);
    return data.signedUrl;
  }
}