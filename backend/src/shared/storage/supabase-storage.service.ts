import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { envs } from "../../config/envs.js";
import type { IStorageService } from "./storage.interface.js";

export class SupabaseStorageService implements IStorageService {
  private supabase: SupabaseClient;
  private bucketName = "pdf-cotizaciones"; // El nombre que creaste en tu panel

  constructor() {
    // Estas credenciales van en tu archivo .env
    const url = envs.SUPABASE_URL;
    const key = envs.SUPABASE_KEY;

    this.supabase = createClient(url, key);
  }

  async subirArchivo(
    buffer: Buffer,
    nombreArchivo: string,
    mimeType: string,
  ): Promise<string> {
    // 1. Subir el archivo al bucket
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(nombreArchivo, buffer, {
        contentType: mimeType,
        upsert: true, // Si ya existe, lo reemplaza
      });

    if (error) {
      throw new Error(`Error al subir a Supabase Storage: ${error.message}`);
    }

    // 2. Obtener y retornar la URL pública del archivo subido
    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(nombreArchivo);

    return urlData.publicUrl; // Retorna el string exacto que guardarás en Prisma
  }

  async borrarArchivo(nombreArchivo: string): Promise<void> {
    await this.supabase.storage.from(this.bucketName).remove([nombreArchivo]);
  }
}
