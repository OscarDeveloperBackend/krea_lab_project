import type { Request, Response } from "express";
import {
  UpdateConfiguracionGeneralDto,
  UpdateConfiguracionMaquinaDto,
} from "../../domain/dtos/configuracion/index.js";
import { CustomError } from "../../domain/errors/index.js";
import type { ConfiguracionGeneralService } from "../../services/configuracion.service.js";

export class ConfiguracionGeneralController {
  constructor(
    private readonly configuracionService: ConfiguracionGeneralService,
  ) {}

  get = async (_req: Request, res: Response) => {
    try {
      const entity = await this.configuracionService.get();
      return res.status(200).json(entity);
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ mensaje: error.message });
      }

      console.error("Error al obtener la configuración general:", error);
      return res.status(500).json({ mensaje: "Error interno del servidor." });
    }
  };

  Get = this.get;

  /**
   * Actualiza los parámetros de la configuración general base (precio kWh, mano de obra, etc.)
   */
  updateGeneral = async (req: Request, res: Response) => {
    const [errors, dto] = UpdateConfiguracionGeneralDto.create(req.body);

    if (errors || !dto) {
      return res.status(400).json({ errores: errors });
    }

    try {
      const updated = await this.configuracionService.updateGeneral(dto);
      return res.status(200).json({
        mensaje: "Configuración general actualizada correctamente.",
        data: updated,
      });
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ mensaje: error.message });
      }

      console.error("Error al actualizar la configuración general:", error);
      return res
        .status(500)
        .json({ mensaje: "Error interno al actualizar la configuración general." });
    }
  };

  /**
   * Actualiza los parámetros de máquina para una tecnología específica (FILAMENTO o RESINA)
   */
  updateMaquina = async (req: Request, res: Response) => {
    const [errors, dto] = UpdateConfiguracionMaquinaDto.create(
      req.params.tecnologia,
      req.body,
    );

    if (errors || !dto) {
      return res.status(400).json({ errores: errors });
    }

    try {
      const updated = await this.configuracionService.updateMaquina(dto);
      return res.status(200).json({
        mensaje: `Configuración de máquina (${dto.tecnologia}) actualizada correctamente.`,
        data: updated,
      });
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ mensaje: error.message });
      }

      console.error("Error al actualizar la configuración de máquina:", error);
      return res
        .status(500)
        .json({ mensaje: "Error interno al actualizar la configuración de máquina." });
    }
  };
}
