import type { Request, Response } from "express";
import type { MaterialService } from "../../services/index.js";
import { CustomError } from "../../domain/errors/index.js";

export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  getAll = async (_req: Request, res: Response) => {
    try {
      const materiales = await this.materialService.getAll();
      return res.status(200).json(materiales);
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          mensaje: error.message,
          error: error.message,
        });
      }

      console.error("Error al obtener los materiales:", error);
      return res.status(500).json({ mensaje: "Error interno del servidor." });
    }
  };
}
