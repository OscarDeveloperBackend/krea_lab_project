import type { EstadoCotizacion } from "@prisma/client";

export type CotizacionFilterErrors = Record<string, string>;

const ESTADOS_VALIDOS: readonly string[] = [
  "PENDIENTE",
  "ENVIADA",
  "ACEPTADA",
  "EN_PROCESO",
  "RECHAZADA",
  "VENCIDA",
];

export class CotizacionFilterDto {
  private constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly search?: string,
    public readonly materialId?: number,
    public readonly estado?: EstadoCotizacion,
  ) {}

  static create(query: Record<string, unknown>): [CotizacionFilterErrors | undefined, CotizacionFilterDto?] {
    const errors: CotizacionFilterErrors = {};

    // 1. Paginación
    let page = 1;
    if (query.page !== undefined && query.page !== "") {
      const parsedPage = Number(query.page);
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        errors.page = "La página debe ser un número entero mayor a 0.";
      } else {
        page = parsedPage;
      }
    }

    let limit = 10;
    const isAll = query.all === "true" || query.all === true;

    if (isAll) {
      limit = 1000;
    } else if (query.limit !== undefined && query.limit !== "") {
      const parsedLimit = Number(query.limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        errors.limit = "El límite debe ser un número entero mayor a 0.";
      } else {
        limit = Math.min(parsedLimit, 1000);
      }
    }

    // 2. Búsqueda por cliente, pedido o ID
    let search: string | undefined;
    if (typeof query.search === "string" && query.search.trim().length > 0) {
      search = query.search.trim();
    } else if (typeof query.q === "string" && query.q.trim().length > 0) {
      search = query.q.trim();
    }

    // 3. Filtro por material
    let materialId: number | undefined;
    if (query.materialId !== undefined && query.materialId !== "") {
      const parsedMat = Number(query.materialId);
      if (!Number.isInteger(parsedMat) || parsedMat <= 0) {
        errors.materialId = "El ID de material debe ser un entero positivo.";
      } else {
        materialId = parsedMat;
      }
    }

    // 4. Filtro por estado
    let estado: EstadoCotizacion | undefined;
    if (typeof query.estado === "string" && query.estado.trim().length > 0) {
      const estadoUpper = query.estado.trim().toUpperCase();
      if (!ESTADOS_VALIDOS.includes(estadoUpper)) {
        errors.estado = `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}.`;
      } else {
        estado = estadoUpper as EstadoCotizacion;
      }
    }

    if (Object.keys(errors).length > 0) {
      return [errors];
    }

    return [
      undefined,
      new CotizacionFilterDto(page, limit, search, materialId, estado),
    ];
  }
}
