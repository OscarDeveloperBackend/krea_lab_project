import type { Request, Response } from "express";
import { CustomError } from "../../domain/errors/index.js";
import type { ConfiguracionGeneralService } from "../../services/configuracion.service.js";

export class ConfiguracionInicialController {
  constructor(
    private readonly configuracionInicialService: ConfiguracionGeneralService,
  ) {}

  get = async (_req: Request, res: Response) => {
    try {
      const configuracionInicial =
        await this.configuracionInicialService.getInicial();
      return res.status(200).json(configuracionInicial);
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({ mensaje: error.message });
      }

      console.error("Error al obtener la configuración inicial:", error);
      return res.status(500).json({ mensaje: "Error interno del servidor." });
    }
  };

  Get = this.get;
}
