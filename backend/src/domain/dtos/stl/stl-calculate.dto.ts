export type StlCalculateErrors = Record<string, string>;

export interface UploadedStlFile {
  originalname: string;
  size: number;
  buffer: Buffer;
}

function isUploadedStlFile(value: unknown): value is UploadedStlFile {
  if (typeof value !== "object" || value === null) return false;

  const file = value as Partial<UploadedStlFile>;
  return (
    typeof file.originalname === "string" &&
    typeof file.size === "number" &&
    file.size > 0 &&
    Buffer.isBuffer(file.buffer)
  );
}

export class StlCalculateDto {
  private constructor(public readonly archivo: UploadedStlFile) {}

  static create(
    object: unknown,
  ): [StlCalculateErrors | undefined, StlCalculateDto?] {
    const errors: StlCalculateErrors = {};
    const body =
      typeof object === "object" && object !== null
        ? (object as Record<string, unknown>)
        : {};
    const archivo = body.archivo;

    if (!isUploadedStlFile(archivo)) {
      errors.archivo = "Falta el archivo STL o no es válido.";
    } else if (!archivo.originalname.toLowerCase().endsWith(".stl")) {
      errors.archivo = "Solo se permiten archivos con extensión .stl.";
    }

    if (Object.keys(errors).length > 0) {
      return [errors];
    }
    return [undefined, new StlCalculateDto(archivo as UploadedStlFile)];
  }
}
