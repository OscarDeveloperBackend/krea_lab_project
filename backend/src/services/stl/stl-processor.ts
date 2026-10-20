import { createHash } from "node:crypto";
import NodeStl from "node-stl";
import type { UploadedStlFile } from "../../domain/dtos/cotizaciones/cotizacion-calculate.dto.js";
import { StlCalculateEntity } from "../../domain/entities/stl-calculate.entity.js";
import { StlValidationError } from "../../domain/errors/cotizacion.errors.js";

export class StlProcessor {
  process(file: UploadedStlFile, hash?: string): StlCalculateEntity {
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new StlValidationError(
        "El archivo recibido no contiene datos válidos.",
      );
    }

    const bufferLength = file.buffer.length;
    const startsWithSolid = file.buffer
      .toString("ascii", 0, Math.min(bufferLength, 200))
      .trimStart()
      .toLowerCase()
      .startsWith("solid");
    const isAsciiBytes = file.buffer.every((byte) => byte <= 0x7f);

    let esFormatoAscii = false;
    let triangulos = 0;

    if (bufferLength >= 84) {
      const numeroTriangulosDeclarados = file.buffer.readUInt32LE(80);
      const tamañoEsperado = 84 + numeroTriangulosDeclarados * 50;

      if (tamañoEsperado === bufferLength) {
        triangulos = numeroTriangulosDeclarados;
      } else if (startsWithSolid && isAsciiBytes) {
        esFormatoAscii = true;
        triangulos = this.validateAscii(file.buffer.toString("ascii"));
      } else if (bufferLength < tamañoEsperado) {
        throw new StlValidationError(
          `El archivo STL binario está incompleto. Faltan datos para procesar los ${numeroTriangulosDeclarados} triángulos declarados.`,
        );
      } else {
        throw new StlValidationError(
          "El tamaño del archivo STL binario no coincide con la cantidad de triángulos declarada.",
        );
      }
    } else if (startsWithSolid && isAsciiBytes) {
      esFormatoAscii = true;
      triangulos = this.validateAscii(file.buffer.toString("ascii"));
    } else {
      throw new StlValidationError(
        "El archivo STL está incompleto o no tiene una estructura ASCII o binaria válida.",
      );
    }

    if (triangulos === 0) {
      throw new StlValidationError(
        "El archivo STL no contiene triángulos para procesar.",
      );
    }

    if (!esFormatoAscii) {
      for (let index = 0; index < triangulos; index += 1) {
        const triangleOffset = 84 + index * 50;
        for (
          let coordinateOffset = 0;
          coordinateOffset < 48;
          coordinateOffset += 4
        ) {
          if (
            !Number.isFinite(
              file.buffer.readFloatLE(triangleOffset + coordinateOffset),
            )
          ) {
            throw new StlValidationError(
              `El triángulo ${index + 1} contiene coordenadas no válidas.`,
            );
          }
        }
      }
    }

    let stl: NodeStl;
    try {
      stl = new NodeStl(file.buffer);
    } catch {
      throw new StlValidationError(
        "La estructura interna del modelo 3D no pudo ser interpretada de forma segura.",
      );
    }

    if (!stl.isWatertight) {
      throw new StlValidationError(
        "El modelo STL tiene errores geométricos y no es estanco (tiene agujeros).",
      );
    }

    const dimX = stl.boundingBox?.[0] ?? 0;
    const dimY = stl.boundingBox?.[1] ?? 0;
    const dimZ = stl.boundingBox?.[2] ?? 0;

    if (
      ![stl.volume, stl.area, stl.weight, dimX, dimY, dimZ].every(
        Number.isFinite,
      )
    ) {
      throw new StlValidationError(
        "El archivo STL produjo medidas geométricas no válidas.",
      );
    }

    return new StlCalculateEntity(
      hash ?? createHash("sha256").update(file.buffer).digest("hex"),
      file.originalname,
      file.size,
      esFormatoAscii ? "ASCII" : "BINARIO",
      null,
      triangulos,
      stl.volume,
      stl.area,
      dimX,
      dimY,
      dimZ,
      stl.isWatertight,
    );
  }

  private validateAscii(content: string): number {
    const facetBlocks =
      content.match(/facet\s+normal\b[\s\S]*?endfacet/gi) ?? [];
    const declaredFacets = content.match(/\bfacet\s+normal\b/gi) ?? [];
    const hasSolidHeader = /^\s*solid(?:\s|$)/i.test(content);
    const hasSolidFooter = /\bendsolid\b/i.test(content);

    if (
      !hasSolidHeader ||
      !hasSolidFooter ||
      facetBlocks.length === 0 ||
      facetBlocks.length !== declaredFacets.length
    ) {
      throw new StlValidationError(
        "El archivo STL ASCII está incompleto o no contiene facetas válidas.",
      );
    }

    const number = String.raw`[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?`;
    const facetPattern = new RegExp(
      String.raw`^\s*facet\s+normal\s+${number}\s+${number}\s+${number}\s+outer\s+loop\s+vertex\s+${number}\s+${number}\s+${number}\s+vertex\s+${number}\s+${number}\s+${number}\s+vertex\s+${number}\s+${number}\s+${number}\s+endloop\s+endfacet\s*$`,
      "i",
    );

    if (facetBlocks.some((facet) => !facetPattern.test(facet))) {
      throw new StlValidationError(
        "El archivo STL ASCII contiene una faceta con formato o coordenadas no válidas.",
      );
    }

    return facetBlocks.length;
  }
}
