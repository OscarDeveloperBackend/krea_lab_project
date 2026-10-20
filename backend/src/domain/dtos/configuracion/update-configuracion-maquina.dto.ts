import type { Tecnologia } from "@prisma/client";

export type UpdateConfiguracionMaquinaErrors = Record<string, string>;

const TECNOLOGIAS = ["FILAMENTO", "RESINA"] as const;

export class UpdateConfiguracionMaquinaDto {
  private constructor(
    public readonly tecnologia: Tecnologia,
    public readonly nombreMaquina?: string | null,
    public readonly consumoWatts?: number,
    public readonly vidaUtilHoras?: number,
    public readonly costoMaquina?: number,
    public readonly camaXMm?: number,
    public readonly camaYMm?: number,
    public readonly camaZMm?: number,
    public readonly porcentajeMerma?: number | null,
    public readonly porcentajeFallos?: number | null,
    public readonly costoPostProceso?: number | null,
  ) {}

  static create(
    rawTecnologia: unknown,
    object: Record<string, unknown>,
  ): [UpdateConfiguracionMaquinaErrors | undefined, UpdateConfiguracionMaquinaDto?] {
    const errors: UpdateConfiguracionMaquinaErrors = {};

    const tecStr = String(rawTecnologia ?? "").trim().toUpperCase();
    if (!TECNOLOGIAS.includes(tecStr as (typeof TECNOLOGIAS)[number])) {
      errors.tecnologia = `La tecnología debe ser una de: ${TECNOLOGIAS.join(", ")}.`;
      return [errors];
    }
    const tecnologia = tecStr as Tecnologia;

    if (typeof object !== "object" || object === null) {
      return [{ body: "El cuerpo de la petición debe ser un objeto JSON válido." }];
    }

    let fieldsCount = 0;

    const parsePositiveNumber = (
      val: unknown,
      fieldName: string,
      allowZero = true,
    ): number | undefined => {
      if (val === undefined) return undefined;
      const num = Number(val);
      if (!Number.isFinite(num) || (allowZero ? num < 0 : num <= 0)) {
        errors[fieldName] = `El valor de ${fieldName} debe ser un número ${allowZero ? "mayor o igual a 0" : "mayor a 0"}.`;
        return undefined;
      }
      fieldsCount++;
      return num;
    };

    const parsePositiveInteger = (
      val: unknown,
      fieldName: string,
      min = 0,
    ): number | undefined => {
      if (val === undefined) return undefined;
      const num = Number(val);
      if (!Number.isInteger(num) || num < min) {
        errors[fieldName] = `El valor de ${fieldName} debe ser un número entero mayor o igual a ${min}.`;
        return undefined;
      }
      fieldsCount++;
      return num;
    };

    let nombreMaquina: string | null | undefined;
    if (object.nombreMaquina !== undefined) {
      nombreMaquina =
        typeof object.nombreMaquina === "string"
          ? object.nombreMaquina.trim() || null
          : null;
      fieldsCount++;
    }

    const consumoWatts = parsePositiveInteger(object.consumoWatts, "consumoWatts", 0);
    const vidaUtilHoras = parsePositiveInteger(object.vidaUtilHoras, "vidaUtilHoras", 1);
    const costoMaquina = parsePositiveNumber(object.costoMaquina, "costoMaquina", true);
    const camaXMm = parsePositiveInteger(object.camaXMm, "camaXMm", 0);
    const camaYMm = parsePositiveInteger(object.camaYMm, "camaYMm", 0);
    const camaZMm = parsePositiveInteger(object.camaZMm, "camaZMm", 0);

    const porcentajeMerma = parsePositiveNumber(object.porcentajeMerma, "porcentajeMerma", true);
    const porcentajeFallos = parsePositiveNumber(object.porcentajeFallos, "porcentajeFallos", true);
    const costoPostProceso = parsePositiveNumber(object.costoPostProceso, "costoPostProceso", true);

    if (fieldsCount === 0 && Object.keys(errors).length === 0) {
      return [{ body: "Debe enviar al menos un campo para actualizar la configuración de máquina." }];
    }

    if (Object.keys(errors).length > 0) {
      return [errors];
    }

    return [
      undefined,
      new UpdateConfiguracionMaquinaDto(
        tecnologia,
        nombreMaquina,
        consumoWatts,
        vidaUtilHoras,
        costoMaquina,
        camaXMm,
        camaYMm,
        camaZMm,
        porcentajeMerma,
        porcentajeFallos,
        costoPostProceso,
      ),
    ];
  }
}
