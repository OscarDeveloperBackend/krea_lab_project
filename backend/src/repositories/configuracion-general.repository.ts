import type { PrismaClient, Prisma, Tecnologia } from "@prisma/client";
import { prisma as prismaClient } from "../config/prisma.js";
import {
  ConfiguracionGeneralEntity,
  ConfiguracionInicialEntity,
  type MaquinaConfiguracionInicial,
  type MaterialConfiguracionInicial,
  type ModoEntregaConfiguracionInicial,
} from "../domain/entities/index.js";
import { CustomNotFoundError } from "../domain/errors/index.js";
import type {
  UpdateConfiguracionGeneralDto,
  UpdateConfiguracionMaquinaDto,
} from "../domain/dtos/configuracion/index.js";

export class ConfiguracionGeneralRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  getConfiguracionGeneral = async (): Promise<ConfiguracionGeneralEntity> => {
    const model = await this.prisma.configuracionGeneral.findFirst();

    if (!model) {
      throw new CustomNotFoundError(
        "No se encontró la configuración general en la base de datos. Asegúrate de ejecutar el seed.",
      );
    }

    return this.toEntity(model);
  };

  private toEntity(
    model: NonNullable<
      Awaited<ReturnType<PrismaClient["configuracionGeneral"]["findFirst"]>>
    >,
  ): ConfiguracionGeneralEntity {
    return new ConfiguracionGeneralEntity(
      model.precioKwh.toNumber(),
      model.tarifaManoObraPorHora.toNumber(),
      model.setupPorDefecto.toNumber(),
      model.minutosManoObraPorDefecto,
      model.multiplicadorPrecioBase.toNumber(),
      model.porcentajeRangoInferior.toNumber(),
      model.porcentajeRangoSuperior.toNumber(),
      model.diasVencimiento,
    );
  }

  getConfiguracionInicial = async (): Promise<ConfiguracionInicialEntity> => {
    const [general, maquinasDb, materialesDb] = await Promise.all([
      this.prisma.configuracionGeneral.findFirst(),
      this.prisma.configuracionMaquina.findMany({ orderBy: { id: "asc" } }),
      this.prisma.material.findMany({
        where: { activo: true },
        orderBy: { id: "asc" },
      }),
    ]);

    if (!general) {
      throw new CustomNotFoundError(
        "La configuración general no ha sido inicializada.",
      );
    }

    const maquinasMapped = maquinasDb.reduce(
      (acc, maq) => {
        acc[maq.tecnologia] = {
          nombreMaquina: maq.nombreMaquina,
          consumoWatts: maq.consumoWatts,
          vidaUtilHoras: maq.vidaUtilHoras,
          costoMaquina: maq.costoMaquina.toNumber(),
          camaXMm: maq.camaXMm,
          camaYMm: maq.camaYMm,
          camaZMm: maq.camaZMm,
          porcentajeMerma: maq.porcentajeMerma
            ? maq.porcentajeMerma.toNumber()
            : null,
          porcentajeFallos: maq.porcentajeFallos
            ? maq.porcentajeFallos.toNumber()
            : null,
          costoPostProceso: maq.costoPostProceso
            ? maq.costoPostProceso.toNumber()
            : null,
        };
        return acc;
      },
      {} as Record<string, MaquinaConfiguracionInicial>,
    );

    const materialesMapped: MaterialConfiguracionInicial[] = materialesDb.map(
      (mat) => ({
        id: mat.id,
        tecnologia: mat.tecnologia,
        nombre: mat.nombre,
        marca: mat.marca,
        precioPorKg: mat.precioPorKg.toNumber(),
        densidadGramosCm3: mat.densidadGramosCm3,
      }),
    );

    const modos: ModoEntregaConfiguracionInicial[] = [
      {
        valor: "NOCTURNO",
        nombre: "Nocturno",
        multiplicador: 1.0,
        plazoEntrega: "3 a 5 días",
      },
      {
        valor: "DIURNO",
        nombre: "Diurno",
        multiplicador: 1.15,
        plazoEntrega: "2 a 3 días",
      },
      {
        valor: "EXPRESS",
        nombre: "Express",
        multiplicador: 1.3,
        plazoEntrega: "24 horas",
      },
    ];

    return new ConfiguracionInicialEntity(
      this.toEntity(general),
      maquinasMapped,
      materialesMapped,
      modos,
    );
  };

  updateConfiguracionGeneral = async (
    dto: UpdateConfiguracionGeneralDto,
  ): Promise<ConfiguracionGeneralEntity> => {
    const existing = await this.prisma.configuracionGeneral.findFirst();

    const data: Prisma.ConfiguracionGeneralUpdateInput = {};
    if (dto.precioKwh !== undefined) data.precioKwh = dto.precioKwh;
    if (dto.tarifaManoObraPorHora !== undefined)
      data.tarifaManoObraPorHora = dto.tarifaManoObraPorHora;
    if (dto.setupPorDefecto !== undefined)
      data.setupPorDefecto = dto.setupPorDefecto;
    if (dto.minutosManoObraPorDefecto !== undefined)
      data.minutosManoObraPorDefecto = dto.minutosManoObraPorDefecto;
    if (dto.multiplicadorPrecioBase !== undefined)
      data.multiplicadorPrecioBase = dto.multiplicadorPrecioBase;
    if (dto.porcentajeRangoInferior !== undefined)
      data.porcentajeRangoInferior = dto.porcentajeRangoInferior;
    if (dto.porcentajeRangoSuperior !== undefined)
      data.porcentajeRangoSuperior = dto.porcentajeRangoSuperior;
    if (dto.diasVencimiento !== undefined)
      data.diasVencimiento = dto.diasVencimiento;

    const id = existing ? existing.id : 1;
    const updated = await this.prisma.configuracionGeneral.upsert({
      where: { id },
      update: data,
      create: {
        precioKwh: dto.precioKwh ?? 0.75,
        tarifaManoObraPorHora: dto.tarifaManoObraPorHora ?? 6.25,
        setupPorDefecto: dto.setupPorDefecto ?? 10,
        minutosManoObraPorDefecto: dto.minutosManoObraPorDefecto ?? 75,
        multiplicadorPrecioBase: dto.multiplicadorPrecioBase ?? 1.8,
        porcentajeRangoInferior: dto.porcentajeRangoInferior ?? 0,
        porcentajeRangoSuperior: dto.porcentajeRangoSuperior ?? 20,
        diasVencimiento: dto.diasVencimiento ?? 7,
      },
    });

    return this.toEntity(updated);
  };

  updateConfiguracionMaquina = async (
    tecnologia: Tecnologia,
    dto: UpdateConfiguracionMaquinaDto,
  ): Promise<MaquinaConfiguracionInicial> => {
    const data: Prisma.ConfiguracionMaquinaUpdateInput = {};
    if (dto.nombreMaquina !== undefined) data.nombreMaquina = dto.nombreMaquina;
    if (dto.consumoWatts !== undefined) data.consumoWatts = dto.consumoWatts;
    if (dto.vidaUtilHoras !== undefined) data.vidaUtilHoras = dto.vidaUtilHoras;
    if (dto.costoMaquina !== undefined) data.costoMaquina = dto.costoMaquina;
    if (dto.camaXMm !== undefined) data.camaXMm = dto.camaXMm;
    if (dto.camaYMm !== undefined) data.camaYMm = dto.camaYMm;
    if (dto.camaZMm !== undefined) data.camaZMm = dto.camaZMm;
    if (dto.porcentajeMerma !== undefined)
      data.porcentajeMerma = dto.porcentajeMerma;
    if (dto.porcentajeFallos !== undefined)
      data.porcentajeFallos = dto.porcentajeFallos;
    if (dto.costoPostProceso !== undefined)
      data.costoPostProceso = dto.costoPostProceso;

    const updated = await this.prisma.configuracionMaquina.upsert({
      where: { tecnologia },
      update: data,
      create: {
        tecnologia,
        nombreMaquina: dto.nombreMaquina ?? null,
        consumoWatts: dto.consumoWatts ?? 100,
        vidaUtilHoras: dto.vidaUtilHoras ?? 8000,
        costoMaquina: dto.costoMaquina ?? 2400,
        camaXMm: dto.camaXMm ?? 256,
        camaYMm: dto.camaYMm ?? 256,
        camaZMm: dto.camaZMm ?? 256,
        porcentajeMerma: dto.porcentajeMerma ?? null,
        porcentajeFallos: dto.porcentajeFallos ?? null,
        costoPostProceso: dto.costoPostProceso ?? null,
      },
    });

    return {
      nombreMaquina: updated.nombreMaquina,
      consumoWatts: updated.consumoWatts,
      vidaUtilHoras: updated.vidaUtilHoras,
      costoMaquina: updated.costoMaquina.toNumber(),
      camaXMm: updated.camaXMm,
      camaYMm: updated.camaYMm,
      camaZMm: updated.camaZMm,
      porcentajeMerma: updated.porcentajeMerma
        ? updated.porcentajeMerma.toNumber()
        : null,
      porcentajeFallos: updated.porcentajeFallos
        ? updated.porcentajeFallos.toNumber()
        : null,
      costoPostProceso: updated.costoPostProceso
        ? updated.costoPostProceso.toNumber()
        : null,
    };
  };
}
