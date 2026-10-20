import type { Material, ModeloStl } from "@prisma/client";
import {
  CotizacionSaveDto,
  type PiezaCotizacionDto,
  type MaquinaConfigDto,
} from "../domain/dtos/cotizaciones/cotizacion-save.dto.js";
import {
  type CotizacionDetailEntity,
  type PaginatedCotizacionesEntity,
} from "../domain/entities/index.js";
import { CotizacionFilterDto } from "../domain/dtos/cotizaciones/cotizacion-filter.dto.js";
import {
  CotizacionNotFoundError,
  InvalidCotizacionIdError,
  CotizacionValidationError,
  ModeloStlNotFoundError,
  MaterialNotFoundError,
  MaterialInactivoError,
} from "../domain/errors/index.js";
import { CotizacionesRepository } from "../repositories/cotizaciones.repository.js";

export const MODOS_ENTREGA = {
  NOCTURNO: { multiplicador: 1.0, plazoEntrega: "3 a 5 días" },
  DIURNO: { multiplicador: 1.15, plazoEntrega: "2 a 3 días" },
  EXPRESS: { multiplicador: 1.3, plazoEntrega: "24 horas" },
} as const;

export interface CalculatedPriceResult {
  gramosConMermaPorUnidad: number | null;
  costoMaterial: number;
  costoElectricidad: number;
  costoDesgasteMaquina: number;
  costoManoObra: number;
  costoSetup: number;
  costoInsumosExtra: number;
  costoPostProceso: number | null;
  costoFallos: number | null;
  costoDirectoPorUnidad: number;
  precioInicialPorUnidad: number;
  precioMinimoPorUnidad: number;
  precioMaximoPorUnidad: number;
  precioFinalPorUnidad: number;
  precioFinalTotal: number;
  esPrecioExactoBackend: boolean;
  estaDentroDeRango: boolean;
}

export class CotizacionesService {
  constructor(
    private readonly cotizacionesRepository: CotizacionesRepository = new CotizacionesRepository(),
  ) {}

  /** Obtiene el listado de cotizaciones paginado y filtrado. */
  async getAll(
    filter: CotizacionFilterDto,
  ): Promise<PaginatedCotizacionesEntity> {
    return this.cotizacionesRepository.getAll(filter);
  }

  /** Valida el identificador y devuelve el detalle o un error de dominio. */
  async getById(id: unknown): Promise<CotizacionDetailEntity> {
    const numericId = this.validateNumericId(id);
    const cotizacion = await this.cotizacionesRepository.getById(numericId);

    if (!cotizacion) {
      throw new CotizacionNotFoundError(numericId);
    }

    return cotizacion;
  }

  /**
   * Calcula detalladamente los costos y precios de una pieza para verificación
   * contra el precio final seleccionado por el usuario en el frontend.
   */
  calculatePrice(params: {
    pieza: PiezaCotizacionDto;
    material: Material;
    maquina: MaquinaConfigDto;
    precioKwh: number;
    tarifaManoObraPorHora: number;
    multiplicadorPrecioBase: number;
    modoMultiplicador: number;
    porcentajeRangoInferior: number;
    porcentajeRangoSuperior: number;
  }): CalculatedPriceResult {
    const {
      pieza,
      material,
      maquina,
      precioKwh,
      tarifaManoObraPorHora,
      multiplicadorPrecioBase,
      modoMultiplicador,
      porcentajeRangoInferior,
      porcentajeRangoSuperior,
    } = params;

    const precioPorKg = material.precioPorKg.toNumber();

    let gramosConMermaPorUnidad: number | null = null;
    let costoMaterial = 0;
    let costoPostProceso: number | null = null;
    let costoFallos: number | null = null;

    if (pieza.tecnologia === "RESINA") {
      const mermaPorcentaje = maquina.porcentajeMerma ?? 0;
      gramosConMermaPorUnidad =
        pieza.gramosPorUnidad * (1 + mermaPorcentaje / 100);
      costoMaterial = (gramosConMermaPorUnidad / 1000) * precioPorKg;
      costoPostProceso = maquina.costoPostProceso ?? 0;
    } else {
      costoMaterial = (pieza.gramosPorUnidad / 1000) * precioPorKg;
    }

    const costoElectricidad =
      pieza.horasPorUnidad * (maquina.consumoWatts / 1000) * precioKwh;

    const costoDesgasteMaquina =
      maquina.vidaUtilHoras > 0
        ? pieza.horasPorUnidad * (maquina.costoMaquina / maquina.vidaUtilHoras)
        : 0;

    const costoManoObra =
      (pieza.minutosManoObraPorUnidad / 60) * tarifaManoObraPorHora;

    const costoSetup = pieza.setupPorUnidad;
    const costoInsumosExtra = pieza.insumosExtraPorUnidad;

    if (pieza.tecnologia === "RESINA") {
      const subtotalBase =
        costoMaterial +
        costoElectricidad +
        costoDesgasteMaquina +
        costoManoObra +
        costoSetup +
        costoInsumosExtra +
        (costoPostProceso ?? 0);

      const fallosPorcentaje = maquina.porcentajeFallos ?? 0;
      costoFallos = subtotalBase * (fallosPorcentaje / 100);
    }

    const costoDirectoPorUnidad =
      costoMaterial +
      costoElectricidad +
      costoDesgasteMaquina +
      costoManoObra +
      costoSetup +
      costoInsumosExtra +
      (costoPostProceso ?? 0) +
      (costoFallos ?? 0);

    const precioInicialPorUnidad = Math.round(
      costoDirectoPorUnidad * multiplicadorPrecioBase * modoMultiplicador,
    );

    const precioMinimoPorUnidad = Math.round(
      precioInicialPorUnidad * (1 - porcentajeRangoInferior / 100),
    );

    const precioMaximoPorUnidad = Math.round(
      precioInicialPorUnidad * (1 + porcentajeRangoSuperior / 100),
    );

    // Comparación y segunda verificación con el precio elegido en frontend
    const precioFinalPorUnidad = pieza.precioFinalPorUnidad;
    const esPrecioExactoBackend =
      precioFinalPorUnidad === precioInicialPorUnidad;
    const estaDentroDeRango =
      precioFinalPorUnidad >= precioMinimoPorUnidad &&
      precioFinalPorUnidad <= precioMaximoPorUnidad;

    return {
      gramosConMermaPorUnidad:
        gramosConMermaPorUnidad !== null
          ? Number(gramosConMermaPorUnidad.toFixed(4))
          : null,
      costoMaterial: Number(costoMaterial.toFixed(2)),
      costoElectricidad: Number(costoElectricidad.toFixed(2)),
      costoDesgasteMaquina: Number(costoDesgasteMaquina.toFixed(2)),
      costoManoObra: Number(costoManoObra.toFixed(2)),
      costoSetup: Number(costoSetup.toFixed(2)),
      costoInsumosExtra: Number(costoInsumosExtra.toFixed(2)),
      costoPostProceso:
        costoPostProceso !== null ? Number(costoPostProceso.toFixed(2)) : null,
      costoFallos: costoFallos !== null ? Number(costoFallos.toFixed(2)) : null,
      costoDirectoPorUnidad: Number(costoDirectoPorUnidad.toFixed(2)),
      precioInicialPorUnidad,
      precioMinimoPorUnidad,
      precioMaximoPorUnidad,
      precioFinalPorUnidad,
      precioFinalTotal: precioFinalPorUnidad * pieza.cantidad,
      esPrecioExactoBackend,
      estaDentroDeRango,
    };
  }

  /**
   * Guarda la cotización procesando los archivos STL previamente cargados,
   * calculando desglose de costos y verificando el precio final enviado.
   */
  async save(dto: CotizacionSaveDto): Promise<CotizacionDetailEntity> {
    const modoInfo = MODOS_ENTREGA[dto.modoEntrega] ?? {
      multiplicador: 1.0,
      plazoEntrega: "3 a 5 días",
    };

    // 1. Obtener días de vencimiento
    const configGeneral =
      await this.cotizacionesRepository.getConfiguracionGeneral();
    const diasVencimiento = configGeneral?.diasVencimiento ?? 7;
    const venceEl = new Date(
      Date.now() + diasVencimiento * 24 * 60 * 60 * 1000,
    );

    // 2. Validar existencias de modelos STL y materiales
    const modelosMap = new Map<string, ModeloStl>();
    const materialesMap = new Map<number, Material>();

    for (const pieza of dto.piezas) {
      if (!modelosMap.has(pieza.modeloHash)) {
        const modelo = await this.cotizacionesRepository.findModeloStlByHash(
          pieza.modeloHash,
        );
        if (!modelo) {
          throw new ModeloStlNotFoundError(pieza.modeloHash);
        }
        modelosMap.set(pieza.modeloHash, modelo);
      }

      if (!materialesMap.has(pieza.materialId)) {
        const material = await this.cotizacionesRepository.findMaterialById(
          pieza.materialId,
        );
        if (!material) {
          throw new MaterialNotFoundError(pieza.materialId);
        }
        if (!material.activo) {
          throw new MaterialInactivoError(material.nombre);
        }
        materialesMap.set(pieza.materialId, material);
      }
    }

    // 3. Procesar y calcular cada pieza
    const stlsData = dto.piezas.map((pieza, index) => {
      const modelo = modelosMap.get(pieza.modeloHash)!;
      const material = materialesMap.get(pieza.materialId)!;

      if (material.tecnologia !== pieza.tecnologia) {
        throw new CotizacionValidationError(
          `La pieza #${index + 1} requiere tecnología ${pieza.tecnologia}, pero el material seleccionado "${material.nombre}" es de tecnología ${material.tecnologia}.`,
        );
      }

      const maquinaConfig = dto.configuracion.maquinas[pieza.tecnologia];
      if (!maquinaConfig) {
        throw new CotizacionValidationError(
          `No se encontró la configuración de máquina para la tecnología ${pieza.tecnologia} en la cotización.`,
        );
      }

      const calculo = this.calculatePrice({
        pieza,
        material,
        maquina: maquinaConfig,
        precioKwh: dto.configuracion.precioKwh,
        tarifaManoObraPorHora: dto.configuracion.tarifaManoObraPorHora,
        multiplicadorPrecioBase: dto.configuracion.multiplicadorPrecioBase,
        modoMultiplicador: modoInfo.multiplicador,
        porcentajeRangoInferior: dto.configuracion.porcentajeRangoInferior,
        porcentajeRangoSuperior: dto.configuracion.porcentajeRangoSuperior,
      });

      console.info(
        `[Verificación Cotización] Modelo: ${modelo.nombreArchivo} (${pieza.tecnologia}) | ` +
          `Backend Precio Base: S/ ${calculo.precioInicialPorUnidad} | ` +
          `Frontend Precio Elegido: S/ ${calculo.precioFinalPorUnidad} | ` +
          `Dentro del rango [${calculo.precioMinimoPorUnidad} - ${calculo.precioMaximoPorUnidad}]: ${calculo.estaDentroDeRango}`,
      );

      return {
        modeloStlId: modelo.id,
        tecnologia: pieza.tecnologia,
        rellenoPorcentaje: pieza.rellenoPorcentaje,
        gramosPorUnidad: pieza.gramosPorUnidad,
        horasPorUnidad: pieza.horasPorUnidad,
        minutosManoObraPorUnidad: pieza.minutosManoObraPorUnidad,
        setupPorUnidad: calculo.costoSetup,
        insumosExtraPorUnidad: calculo.costoInsumosExtra,
        cantidad: pieza.cantidad,
        materialId: material.id,
        materialNombre: material.nombre,
        materialMarca: material.marca,
        materialPrecioPorKg: material.precioPorKg,
        gramosConMermaPorUnidad: calculo.gramosConMermaPorUnidad,
        costoMaterial: calculo.costoMaterial,
        costoElectricidad: calculo.costoElectricidad,
        costoDesgasteMaquina: calculo.costoDesgasteMaquina,
        costoManoObra: calculo.costoManoObra,
        costoSetup: calculo.costoSetup,
        costoInsumosExtra: calculo.costoInsumosExtra,
        costoPostProceso: calculo.costoPostProceso,
        costoFallos: calculo.costoFallos,
        costoDirectoPorUnidad: calculo.costoDirectoPorUnidad,
        precioInicialPorUnidad: calculo.precioInicialPorUnidad,
        precioMinimoPorUnidad: calculo.precioMinimoPorUnidad,
        precioMaximoPorUnidad: calculo.precioMaximoPorUnidad,
        precioFinalPorUnidad: calculo.precioFinalPorUnidad,
        precioFinalTotal: calculo.precioFinalTotal,
      };
    });

    const precioTotal = stlsData.reduce(
      (acc, item) => acc + item.precioFinalTotal,
      0,
    );

    // 4. Persistir la cotización relacionalmente
    return this.cotizacionesRepository.create({
      nombreCliente: dto.nombreCliente,
      telefonoCliente: dto.telefonoCliente,
      correoCliente: dto.correoCliente,
      nombrePedido: dto.nombrePedido,
      estado: "PENDIENTE",
      venceEl,
      notaInterna: dto.comentarioPedido,
      modoEntrega: dto.modoEntrega,
      modoMultiplicador: modoInfo.multiplicador,
      modoPlazoEntrega: modoInfo.plazoEntrega,
      precioKwh: dto.configuracion.precioKwh,
      tarifaManoObraPorHora: dto.configuracion.tarifaManoObraPorHora,
      multiplicadorPrecioBase: dto.configuracion.multiplicadorPrecioBase,
      porcentajeRangoInferior: dto.configuracion.porcentajeRangoInferior,
      porcentajeRangoSuperior: dto.configuracion.porcentajeRangoSuperior,
      parametrosMaquinas: dto.configuracion.maquinas as any,
      precioTotal,
      stls: {
        create: stlsData,
      },
    });
  }

  private validateNumericId(id: unknown): number {
    if (typeof id !== "string" && typeof id !== "number") {
      throw new InvalidCotizacionIdError();
    }

    const strId = String(id).trim();
    if (!/^\d+$/.test(strId)) {
      throw new InvalidCotizacionIdError();
    }

    const numericId = Number(strId);
    if (!Number.isSafeInteger(numericId) || numericId <= 0) {
      throw new InvalidCotizacionIdError();
    }

    return numericId;
  }

  async updatePdf(id: number, urlPdf: string): Promise<CotizacionDetailEntity> {
  return this.cotizacionesRepository.updatePdf(id, urlPdf); 
  }
}
