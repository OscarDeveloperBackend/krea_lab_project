import type { PrismaClient, Prisma } from "@prisma/client";
import { prisma as prismaClient } from "../config/prisma.js";
import {
  CotizacionDetailEntity,
  CotizacionPiezaDetailEntity,
} from "../domain/entities/cotizacion.entity.js";
import {
  CotizacionListEntity,
  PaginatedCotizacionesEntity,
} from "../domain/entities/cotizaciones.entity.js";
import type { CotizacionFilterDto } from "../domain/dtos/cotizaciones/cotizacion-filter.dto.js";

export type CotizacionWithRelations = Prisma.CotizacionGetPayload<{
  include: {
    stls: {
      include: {
        modeloStl: true;
        material: true;
      };
    };
  };
}>;

export class CotizacionesRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  getAll = async (
    filter: CotizacionFilterDto,
  ): Promise<PaginatedCotizacionesEntity> => {
    const where: Prisma.CotizacionWhereInput = {};

    if (filter.estado) {
      where.estado = filter.estado;
    }

    if (filter.materialId) {
      where.stls = {
        some: {
          materialId: filter.materialId,
        },
      };
    }

    if (filter.search) {
      const search = filter.search;
      const isNumeric = /^\d+$/.test(search);
      const orConditions: Prisma.CotizacionWhereInput[] = [
        { nombreCliente: { contains: search, mode: "insensitive" } },
        { nombrePedido: { contains: search, mode: "insensitive" } },
        { telefonoCliente: { contains: search } },
      ];

      if (isNumeric) {
        orConditions.push({ id: Number(search) });
      }

      where.OR = orConditions;
    }

    const [total, cotizaciones] = await Promise.all([
      this.prisma.cotizacion.count({ where }),
      this.prisma.cotizacion.findMany({
        where,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { createdAt: "desc" },
        include: {
          stls: {
            select: {
              id: true,
              cantidad: true,
              materialNombre: true,
            },
          },
        },
      }),
    ]);

    const data = cotizaciones.map((c) => {
      const cantidadPiezas = c.stls.reduce(
        (acc, curr) => acc + curr.cantidad,
        0,
      );
      const materialesUnicos = Array.from(
        new Set(c.stls.map((s) => s.materialNombre)),
      );

      return new CotizacionListEntity(
        c.id,
        c.nombreCliente,
        c.telefonoCliente,
        c.correoCliente,
        c.nombrePedido,
        c.estado,
        c.modoEntrega,
        cantidadPiezas,
        materialesUnicos,
        c.precioTotal,
        c.venceEl,
        c.createdAt,
      );
    });

    const totalPages = Math.ceil(total / filter.limit) || 1;

    return new PaginatedCotizacionesEntity(data, {
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages,
    });
  };

  getById = async (id: number): Promise<CotizacionDetailEntity | null> => {
    const cotizacion = await this.prisma.cotizacion.findUnique({
      where: { id },
      include: {
        stls: {
          include: {
            modeloStl: true,
            material: true,
          },
        },
      },
    });

    if (!cotizacion) {
      return null;
    }

    return this.toDetailEntity(cotizacion);
  };

  create = async (
    data: Prisma.CotizacionCreateInput,
  ): Promise<CotizacionDetailEntity> => {
    const cotizacion = await this.prisma.cotizacion.create({
      data,
      include: {
        stls: {
          include: {
            modeloStl: true,
            material: true,
          },
        },
      },
    });

    return this.toDetailEntity(cotizacion);
  };

  updatePdf = async (
    id: number,
    urlPdf: string,
  ): Promise<CotizacionDetailEntity> => {
    const cotizacion = await this.prisma.cotizacion.update({
      where: { id },
      data: {
        direccionPdf: urlPdf,
      },
      include: {
        stls: {
          include: {
            modeloStl: true,
            material: true,
          },
        },
      },
    });

    return this.toDetailEntity(cotizacion); // 👈 Ahora sí retornará con toda la estructura armada
  };

  findModeloStlByHash = async (hash: string) => {
    return this.prisma.modeloStl.findUnique({
      where: { hash },
    });
  };

  findMaterialById = async (id: number) => {
    return this.prisma.material.findUnique({
      where: { id },
    });
  };

  getConfiguracionGeneral = async () => {
    return this.prisma.configuracionGeneral.findFirst();
  };

  private toDetailEntity(
    cotizacion: CotizacionWithRelations,
  ): CotizacionDetailEntity {
    const piezas = cotizacion.stls.map(
      (stl) =>
        new CotizacionPiezaDetailEntity(
          stl.id,
          {
            id: stl.modeloStl.id,
            hash: stl.modeloStl.hash,
            nombreArchivo: stl.modeloStl.nombreArchivo,
            tamanoBytes: stl.modeloStl.tamanoBytes,
            formato: stl.modeloStl.formato,
            cantidadTriangulos: stl.modeloStl.cantidadTriangulos,
            volumenCm3: stl.modeloStl.volumenCm3,
            areaMm2: stl.modeloStl.areaMm2,
            dimensionXMm: stl.modeloStl.dimensionXMm,
            dimensionYMm: stl.modeloStl.dimensionYMm,
            dimensionZMm: stl.modeloStl.dimensionZMm,
            esMallaCerrada: stl.modeloStl.esMallaCerrada,
          },
          stl.tecnologia,
          {
            id: stl.material.id,
            nombre: stl.materialNombre,
            marca: stl.materialMarca,
            precioPorKg: stl.materialPrecioPorKg.toNumber(),
          },
          stl.rellenoPorcentaje,
          stl.gramosPorUnidad,
          stl.horasPorUnidad,
          stl.minutosManoObraPorUnidad,
          stl.setupPorUnidad.toNumber(),
          stl.insumosExtraPorUnidad.toNumber(),
          stl.cantidad,
          {
            gramosConMermaPorUnidad: stl.gramosConMermaPorUnidad,
            costoMaterial: stl.costoMaterial.toNumber(),
            costoElectricidad: stl.costoElectricidad.toNumber(),
            costoDesgasteMaquina: stl.costoDesgasteMaquina.toNumber(),
            costoManoObra: stl.costoManoObra.toNumber(),
            costoSetup: stl.costoSetup.toNumber(),
            costoInsumosExtra: stl.costoInsumosExtra.toNumber(),
            costoPostProceso: stl.costoPostProceso
              ? stl.costoPostProceso.toNumber()
              : null,
            costoFallos: stl.costoFallos ? stl.costoFallos.toNumber() : null,
            costoDirectoPorUnidad: stl.costoDirectoPorUnidad.toNumber(),
          },
          {
            precioInicialPorUnidad: stl.precioInicialPorUnidad,
            precioMinimoPorUnidad: stl.precioMinimoPorUnidad,
            precioMaximoPorUnidad: stl.precioMaximoPorUnidad,
            precioFinalPorUnidad: stl.precioFinalPorUnidad,
            precioFinalTotal: stl.precioFinalTotal,
          },
        ),
    );

    return new CotizacionDetailEntity(
      cotizacion.id,
      cotizacion.nombreCliente,
      cotizacion.telefonoCliente,
      cotizacion.correoCliente,
      cotizacion.nombrePedido,
      cotizacion.notaInterna,
      cotizacion.direccionPdf,
      cotizacion.estado,
      cotizacion.venceEl,
      {
        modo: cotizacion.modoEntrega,
        multiplicador: cotizacion.modoMultiplicador.toNumber(),
        plazoEntrega: cotizacion.modoPlazoEntrega,
      },
      {
        precioKwh: cotizacion.precioKwh.toNumber(),
        tarifaManoObraPorHora: cotizacion.tarifaManoObraPorHora.toNumber(),
        multiplicadorPrecioBase: cotizacion.multiplicadorPrecioBase.toNumber(),
        porcentajeRangoInferior: cotizacion.porcentajeRangoInferior.toNumber(),
        porcentajeRangoSuperior: cotizacion.porcentajeRangoSuperior.toNumber(),
        maquinas:
          (cotizacion.parametrosMaquinas as Record<string, unknown>) ?? {},
      },
      cotizacion.precioTotal,
      piezas,
      cotizacion.createdAt,
      cotizacion.updatedAt,
    );
  }
}
