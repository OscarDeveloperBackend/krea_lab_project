import type { PrismaClient } from "@prisma/client";
import { prisma as prismaClient } from "../config/prisma.js";
import { MaterialesEntity } from "../domain/entities/index.js";

export class MaterialRepository {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  getAll = async (): Promise<MaterialesEntity[]> => {
    const materiales = await this.prisma.material.findMany({
      where: {
        activo: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return materiales.map(
      (material) =>
        new MaterialesEntity(
          material.id,
          material.tecnologia,
          material.nombre,
          material.marca,
          material.precioPorKg.toNumber(),
          material.densidadGramosCm3,
          material.activo,
        ),
    );
  };
}
