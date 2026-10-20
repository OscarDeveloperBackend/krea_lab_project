import type { Request, Response } from "express";
import {
  CotizacionSaveDto,
  CotizacionFilterDto,
} from "../../domain/dtos/cotizaciones/index.js";
import { CustomError } from "../../domain/errors/index.js";
import type { CotizacionesService } from "../../services/cotizaciones.service.js";
import { SupabaseStorageService } from "../../shared/storage/supabase-storage.service.js";
import type { IStorageService } from "../../shared/storage/storage.interface.js";
import { PdfGeneratorService } from "../../shared/pdf/pdf-generator.service.js";

export class CotizacionesControllers {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  /**
   * Guarda una nueva cotización relacional recibiendo el payload con configuración
   * y desglose de piezas en base a modelos STL previamente procesados.
   */
  save = async (req: Request, res: Response) => {
    const [errors, dto] = CotizacionSaveDto.create(req.body);

    if (errors || !dto) {
      return res.status(400).json({ errores: errors });
    }

    const storageProvider: IStorageService = new SupabaseStorageService();
    let nombrePdfGenerado = "";
    let archivoFueSubido = false;

    try {
      const entity = await this.cotizacionesService.save(dto);
      const pdfService = new PdfGeneratorService();

      nombrePdfGenerado = `cotizacion-${entity.nombrePedido || entity.id}.pdf`;

      const pdfBuffer = await pdfService.generarCotizacionBuffer(entity);

      // Subimos el archivo a Supabase
      const urlPublicaPdf = await storageProvider.subirArchivo(
        pdfBuffer,
        nombrePdfGenerado,
        "application/pdf",
      );

      archivoFueSubido = true;

      const entityActualizada = await this.cotizacionesService.updatePdf(
        entity.id,
        urlPublicaPdf,
      );

      return res.status(201).json(entityActualizada);
    } catch (error) {
      if (archivoFueSubido && nombrePdfGenerado) {
        try {
          await storageProvider.borrarArchivo(nombrePdfGenerado);
          console.log(
            `Limpieza exitosa: Se eliminó el archivo huérfano [${nombrePdfGenerado}] de Supabase.`,
          );
        } catch (storageError) {
          console.error(
            "No se pudo eliminar el archivo huérfano de Supabase:",
            storageError,
          );
        }
      }

      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ mensaje: error.message });
      }

      console.error("Error inesperado al guardar la cotización:", error);
      return res
        .status(500)
        .json({ mensaje: "Error interno al guardar la cotización." });
    }
  };

  /**
   * Devuelve el detalle de una cotización específica con sus modelos STL,
   * materiales y desglose de costos.
   */
  get = async (req: Request, res: Response) => {
    try {
      const cotizacion = await this.cotizacionesService.getById(req.params.id);
      return res.status(200).json(cotizacion);
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ mensaje: error.message });
      }

      console.error("Error al consultar la cotización:", error);
      return res.status(500).json({ mensaje: "Error interno del servidor." });
    }
  };

  /** Devuelve el listado de cotizaciones paginadas y filtradas. */
  getAll = async (req: Request, res: Response) => {
    const [errors, filterDto] = CotizacionFilterDto.create(
      req.query as Record<string, unknown>,
    );

    if (errors || !filterDto) {
      return res.status(400).json({ errores: errors });
    }

    try {
      const result = await this.cotizacionesService.getAll(filterDto);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error al consultar las cotizaciones:", error);
      return res.status(500).json({ mensaje: "Error interno del servidor." });
    }
  };

  /** Mantiene explícito que la actualización aún no está disponible. */
  update = (_req: Request, res: Response) => {
    return res.status(501).json({
      mensaje: "La actualización de cotizaciones aún no está disponible.",
    });
  };
}
