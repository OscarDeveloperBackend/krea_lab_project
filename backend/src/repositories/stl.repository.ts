import type { PrismaClient } from "@prisma/client";
import { prisma as prismaClient } from "../config/prisma.js";
import { StlCalculateEntity } from "../domain/entities/stl-calculate.entity.js";

export class StlRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  findByHash = async (hash: string): Promise<StlCalculateEntity | null> => {
    const model = await this.prisma.modeloStl.findUnique({ where: { hash } });
    return model ? this.toEntity(model) : null;
  };

  stlModelCreate = async (
    dto: StlCalculateEntity,
  ): Promise<StlCalculateEntity> => {
    try {
      const model = await this.prisma.modeloStl.create({
        data: {
          hash: dto.hash,
          nombreArchivo: dto.nombreArchivo,
          tamanoBytes: dto.sizeFile,
          formato: dto.formato,
          claveAlmacenamiento: dto.claveAlmacenamiento ?? dto.hash,
          cantidadTriangulos: dto.cantidadTriangulos,
          volumenCm3: dto.volumen,
          areaMm2: dto.area,
          dimensionXMm: dto.dimensionX,
          dimensionYMm: dto.dimensionY,
          dimensionZMm: dto.dimensionZ,
          esMallaCerrada: dto.esMallaCerrada,
        },
      });

      return this.toEntity(model);
    } catch (error: any) {
      // Manejo de condición de carrera si el archivo ya fue insertado concurrentemente
      if (error?.code === "P2002") {
        const existing = await this.findByHash(dto.hash);
        if (existing) return existing;
      }
      throw error;
    }
  };

  private toEntity(model: {
    hash: string;
    nombreArchivo: string;
    tamanoBytes: number;
    formato: "ASCII" | "BINARIO";
    claveAlmacenamiento: string;
    cantidadTriangulos: number;
    volumenCm3: number;
    areaMm2: number;
    dimensionXMm: number;
    dimensionYMm: number;
    dimensionZMm: number;
    esMallaCerrada: boolean;
  }): StlCalculateEntity {
    return new StlCalculateEntity(
      model.hash,
      model.nombreArchivo,
      model.tamanoBytes,
      model.formato,
      model.claveAlmacenamiento,
      model.cantidadTriangulos,
      model.volumenCm3,
      model.areaMm2,
      model.dimensionXMm,
      model.dimensionYMm,
      model.dimensionZMm,
      model.esMallaCerrada,
    );
  }
}
