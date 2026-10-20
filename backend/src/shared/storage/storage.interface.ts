export interface IStorageService {
  subirArchivo(
    buffer: Buffer,
    nombreArchivo: string,
    mimeType: string,
  ): Promise<string>;

  borrarArchivo(nombreArchivo: string): Promise<void>;
}
