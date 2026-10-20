import type { ModoEntrega, Tecnologia } from "@prisma/client";

export type CotizacionSaveErrors = Record<string, string>;

export interface MaquinaConfigDto {
  consumoWatts: number;
  vidaUtilHoras: number;
  costoMaquina: number;
  porcentajeMerma?: number | null;
  porcentajeFallos?: number | null;
  costoPostProceso?: number | null;
}

export interface ConfiguracionCotizacionDto {
  precioKwh: number;
  tarifaManoObraPorHora: number;
  multiplicadorPrecioBase: number;
  porcentajeRangoInferior: number;
  porcentajeRangoSuperior: number;
  maquinas: {
    FILAMENTO?: MaquinaConfigDto;
    RESINA?: MaquinaConfigDto;
    [key: string]: MaquinaConfigDto | undefined;
  };
}

export interface PiezaCotizacionDto {
  modeloHash: string;
  tecnologia: Tecnologia;
  materialId: number;
  rellenoPorcentaje: number | null;
  gramosPorUnidad: number;
  horasPorUnidad: number;
  minutosManoObraPorUnidad: number;
  setupPorUnidad: number;
  insumosExtraPorUnidad: number;
  cantidad: number;
  precioFinalPorUnidad: number;
}

const MODOS_ENTREGA = ["NOCTURNO", "DIURNO", "EXPRESS"] as const;
const TECNOLOGIAS = ["FILAMENTO", "RESINA"] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^\+?[\d\s-]{7,20}$/;

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export class CotizacionSaveDto {
  private constructor(
    public readonly nombreCliente: string,
    public readonly telefonoCliente: string,
    public readonly correoCliente: string | null,
    public readonly nombrePedido: string | null,
    public readonly comentarioPedido: string | null,
    public readonly modoEntrega: ModoEntrega,
    public readonly configuracion: ConfiguracionCotizacionDto,
    public readonly piezas: PiezaCotizacionDto[],
  ) {}

  static create(object: unknown): [CotizacionSaveErrors | undefined, CotizacionSaveDto?] {
    const errors: CotizacionSaveErrors = {};

    if (typeof object !== "object" || object === null) {
      return [{ body: "El cuerpo de la petición debe ser un objeto JSON válido." }];
    }

    const body = object as Record<string, unknown>;

    // 1. Cliente
    const nombreCliente = toText(body.nombreCliente);
    if (!nombreCliente) {
      errors.nombreCliente = "El nombre del cliente es obligatorio.";
    }

    const telefonoCliente = toText(body.telefonoCliente);
    if (!telefonoCliente) {
      errors.telefonoCliente = "El teléfono del cliente es obligatorio.";
    } else if (!TELEFONO_REGEX.test(telefonoCliente)) {
      errors.telefonoCliente = "El teléfono debe contener entre 7 y 20 caracteres válidos.";
    }

    const correoRaw = toText(body.correoCliente);
    let correoCliente: string | null = null;
    if (correoRaw) {
      if (!EMAIL_REGEX.test(correoRaw)) {
        errors.correoCliente = "El correo electrónico no tiene un formato válido.";
      } else {
        correoCliente = correoRaw.toLowerCase();
      }
    }

    const nombrePedido = toText(body.nombrePedido) || null;
    const comentarioPedido = toText(body.comentarioPedido) || null;

    // 2. Modo Entrega
    const modoEntregaRaw = toText(body.modoEntrega).toUpperCase();
    if (!MODOS_ENTREGA.includes(modoEntregaRaw as (typeof MODOS_ENTREGA)[number])) {
      errors.modoEntrega = `El modo de entrega debe ser uno de: ${MODOS_ENTREGA.join(", ")}.`;
    }
    const modoEntrega = modoEntregaRaw as ModoEntrega;

    // 3. Configuración
    const rawConfig = body.configuracion;
    let configuracion: ConfiguracionCotizacionDto | null = null;

    if (typeof rawConfig !== "object" || rawConfig === null) {
      errors.configuracion = "La configuración de la cotización es obligatoria.";
    } else {
      const cfg = rawConfig as Record<string, unknown>;
      const precioKwh = toNumber(cfg.precioKwh);
      const tarifaManoObraPorHora = toNumber(cfg.tarifaManoObraPorHora);
      const multiplicadorPrecioBase = toNumber(cfg.multiplicadorPrecioBase);
      const porcentajeRangoInferior = toNumber(cfg.porcentajeRangoInferior);
      const porcentajeRangoSuperior = toNumber(cfg.porcentajeRangoSuperior);

      if (precioKwh === null || precioKwh < 0) {
        errors["configuracion.precioKwh"] = "El precio del kWh debe ser un número mayor o igual a 0.";
      }
      if (tarifaManoObraPorHora === null || tarifaManoObraPorHora < 0) {
        errors["configuracion.tarifaManoObraPorHora"] = "La tarifa de mano de obra por hora debe ser mayor o igual a 0.";
      }
      if (multiplicadorPrecioBase === null || multiplicadorPrecioBase <= 0) {
        errors["configuracion.multiplicadorPrecioBase"] = "El multiplicador de precio base debe ser un número mayor a 0.";
      }
      if (porcentajeRangoInferior === null || porcentajeRangoInferior < 0) {
        errors["configuracion.porcentajeRangoInferior"] = "El porcentaje de rango inferior debe ser mayor o igual a 0.";
      }
      if (porcentajeRangoSuperior === null || porcentajeRangoSuperior < 0) {
        errors["configuracion.porcentajeRangoSuperior"] = "El porcentaje de rango superior debe ser mayor o igual a 0.";
      }

      const rawMaquinas = cfg.maquinas;
      const parsedMaquinas: ConfiguracionCotizacionDto["maquinas"] = {};

      if (typeof rawMaquinas !== "object" || rawMaquinas === null) {
        errors["configuracion.maquinas"] = "La configuración de máquinas es requerida.";
      } else {
        const mqObj = rawMaquinas as Record<string, unknown>;
        for (const tec of TECNOLOGIAS) {
          if (mqObj[tec]) {
            const mq = mqObj[tec] as Record<string, unknown>;
            const consumoWatts = toNumber(mq.consumoWatts);
            const vidaUtilHoras = toNumber(mq.vidaUtilHoras);
            const costoMaquina = toNumber(mq.costoMaquina);

            if (consumoWatts === null || consumoWatts < 0) {
              errors[`configuracion.maquinas.${tec}.consumoWatts`] = `El consumo en Watts de ${tec} debe ser mayor o igual a 0.`;
            }
            if (vidaUtilHoras === null || vidaUtilHoras <= 0) {
              errors[`configuracion.maquinas.${tec}.vidaUtilHoras`] = `La vida útil en horas de ${tec} debe ser mayor a 0.`;
            }
            if (costoMaquina === null || costoMaquina < 0) {
              errors[`configuracion.maquinas.${tec}.costoMaquina`] = `El costo de máquina de ${tec} debe ser mayor o igual a 0.`;
            }

            parsedMaquinas[tec] = {
              consumoWatts: consumoWatts ?? 0,
              vidaUtilHoras: vidaUtilHoras ?? 1,
              costoMaquina: costoMaquina ?? 0,
              porcentajeMerma: toNumber(mq.porcentajeMerma),
              porcentajeFallos: toNumber(mq.porcentajeFallos),
              costoPostProceso: toNumber(mq.costoPostProceso),
            };
          }
        }
      }

      if (
        precioKwh !== null &&
        tarifaManoObraPorHora !== null &&
        multiplicadorPrecioBase !== null &&
        porcentajeRangoInferior !== null &&
        porcentajeRangoSuperior !== null
      ) {
        configuracion = {
          precioKwh,
          tarifaManoObraPorHora,
          multiplicadorPrecioBase,
          porcentajeRangoInferior,
          porcentajeRangoSuperior,
          maquinas: parsedMaquinas,
        };
      }
    }

    // 4. Piezas
    const rawPiezas = body.piezas;
    const parsedPiezas: PiezaCotizacionDto[] = [];

    if (!Array.isArray(rawPiezas) || rawPiezas.length === 0) {
      errors.piezas = "Debe enviar al menos una pieza en el arreglo de piezas.";
    } else {
      rawPiezas.forEach((p, idx) => {
        if (typeof p !== "object" || p === null) {
          errors[`piezas[${idx}]`] = "Cada elemento en piezas debe ser un objeto válido.";
          return;
        }

        const piezaObj = p as Record<string, unknown>;
        const modeloHash = toText(piezaObj.modeloHash);
        if (!modeloHash) {
          errors[`piezas[${idx}].modeloHash`] = "El hash del modelo es obligatorio.";
        }

        const tecRaw = toText(piezaObj.tecnologia).toUpperCase();
        if (!TECNOLOGIAS.includes(tecRaw as (typeof TECNOLOGIAS)[number])) {
          errors[`piezas[${idx}].tecnologia`] = `La tecnología debe ser una de: ${TECNOLOGIAS.join(", ")}.`;
        }
        const tecnologia = tecRaw as Tecnologia;

        const materialId = toNumber(piezaObj.materialId);
        if (materialId === null || !Number.isInteger(materialId) || materialId <= 0) {
          errors[`piezas[${idx}].materialId`] = "El ID del material debe ser un número entero positivo.";
        }

        const rellenoPorcentaje = toNumber(piezaObj.rellenoPorcentaje);
        const gramosPorUnidad = toNumber(piezaObj.gramosPorUnidad);
        if (gramosPorUnidad === null || gramosPorUnidad < 0) {
          errors[`piezas[${idx}].gramosPorUnidad`] = "Los gramos por unidad deben ser un número mayor o igual a 0.";
        }

        const horasPorUnidad = toNumber(piezaObj.horasPorUnidad);
        if (horasPorUnidad === null || horasPorUnidad < 0) {
          errors[`piezas[${idx}].horasPorUnidad`] = "Las horas por unidad deben ser un número mayor o igual a 0.";
        }

        const minutosManoObraPorUnidad = toNumber(piezaObj.minutosManoObraPorUnidad);
        if (minutosManoObraPorUnidad === null || minutosManoObraPorUnidad < 0) {
          errors[`piezas[${idx}].minutosManoObraPorUnidad`] = "Los minutos de mano de obra deben ser mayor o igual a 0.";
        }

        const setupPorUnidad = toNumber(piezaObj.setupPorUnidad);
        if (setupPorUnidad === null || setupPorUnidad < 0) {
          errors[`piezas[${idx}].setupPorUnidad`] = "El setup por unidad debe ser mayor o igual a 0.";
        }

        const insumosExtraPorUnidad = toNumber(piezaObj.insumosExtraPorUnidad);
        if (insumosExtraPorUnidad === null || insumosExtraPorUnidad < 0) {
          errors[`piezas[${idx}].insumosExtraPorUnidad`] = "Los insumos extra deben ser mayor o igual a 0.";
        }

        const cantidad = toNumber(piezaObj.cantidad);
        if (cantidad === null || !Number.isInteger(cantidad) || cantidad <= 0) {
          errors[`piezas[${idx}].cantidad`] = "La cantidad debe ser un número entero mayor a 0.";
        }

        const precioFinalPorUnidad = toNumber(piezaObj.precioFinalPorUnidad);
        if (precioFinalPorUnidad === null || precioFinalPorUnidad < 0) {
          errors[`piezas[${idx}].precioFinalPorUnidad`] = "El precio final por unidad debe ser un número mayor o igual a 0.";
        }

        if (
          modeloHash &&
          tecnologia &&
          materialId !== null &&
          gramosPorUnidad !== null &&
          horasPorUnidad !== null &&
          minutosManoObraPorUnidad !== null &&
          setupPorUnidad !== null &&
          insumosExtraPorUnidad !== null &&
          cantidad !== null &&
          precioFinalPorUnidad !== null
        ) {
          parsedPiezas.push({
            modeloHash,
            tecnologia,
            materialId,
            rellenoPorcentaje,
            gramosPorUnidad,
            horasPorUnidad,
            minutosManoObraPorUnidad,
            setupPorUnidad,
            insumosExtraPorUnidad,
            cantidad,
            precioFinalPorUnidad: Math.round(precioFinalPorUnidad),
          });
        }
      });
    }

    if (Object.keys(errors).length > 0 || !configuracion) {
      return [errors];
    }

    return [
      undefined,
      new CotizacionSaveDto(
        nombreCliente,
        telefonoCliente,
        correoCliente,
        nombrePedido,
        comentarioPedido,
        modoEntrega,
        configuracion,
        parsedPiezas,
      ),
    ];
  }
}
