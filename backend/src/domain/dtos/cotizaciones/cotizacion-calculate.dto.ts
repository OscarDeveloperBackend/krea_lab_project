export type CotizacionCalculateErrors = Record<string, string>;
const MATERIALES = [
  "pla",
  "abs",
  "petg",
  "flex",
  "asa",
  "resina_abs",
  "resina_abs_transparente",
] as const;
const URGENCIAS = ["NOCTURNO", "DIURNO", "EXPRESS"] as const;

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

export class CotizacionCalculateDto {
  private constructor(
    public readonly archivo: UploadedStlFile,
    // public readonly material: string,
    // public readonly cantidad: number,
    // public readonly urgencia: (typeof URGENCIAS)[number],
  ) {}

  /** Valida el archivo y los parámetros requeridos para calcular una cotización. */
  static create(
    object: unknown,
  ): [CotizacionCalculateErrors | undefined, CotizacionCalculateDto?] {
    const errors: CotizacionCalculateErrors = {};
    const body =
      typeof object === "object" && object !== null
        ? (object as Record<string, unknown>)
        : {};
    const archivo = body.archivo;
    // const material =
    //   typeof body.material === "string"
    //     ? body.material.trim().toLowerCase()
    //     : "";
    // const urgencia =
    //   typeof body.urgencia === "string"
    //     ? body.urgencia.trim().toUpperCase()
    //     : "";
    // const cantidad = Number(body.cantidad);

    if (!isUploadedStlFile(archivo)) {
      errors.archivo = "Falta el archivo STL o no es válido.";
    } else if (!archivo.originalname.toLowerCase().endsWith(".stl")) {
      errors.archivo = "Solo se permiten archivos con extensión .stl.";
    }

    // if (!(MATERIALES as readonly string[]).includes(material)) {
    //   errors.material = `El material debe ser una de estas opciones: ${MATERIALES.join(", ")}.`;
    // }

    // if (!Number.isInteger(cantidad) || cantidad < 1) {
    //   errors.cantidad = "La cantidad debe ser un número entero mayor que cero.";
    // }

    // if (!(URGENCIAS as readonly string[]).includes(urgencia)) {
    //   errors.urgencia = `La urgencia debe ser una de estas opciones: ${URGENCIAS.join(", ")}.`;
    // }

    if (Object.keys(errors).length > 0) {
      return [errors];
    }

    return [
      undefined,
      new CotizacionCalculateDto(
        archivo as UploadedStlFile,
        // material,
        // cantidad as number,
        // urgencia as (typeof URGENCIAS)[number],
      ),
    ];
  }
}
