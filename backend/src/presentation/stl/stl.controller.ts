import type { Request, Response } from "express";
import { StlCalculateDto } from "../../domain/dtos/index.js";
import { CustomError } from "../../domain/errors/index.js";
import type { StlService } from "../../services/stl.service.js";

export class StlController {
  constructor(private readonly stlService: StlService) {}

  calculate = async (req: Request, res: Response) => {
    const [errors, dto] = StlCalculateDto.create({
      ...req.body,
      archivo: req.file,
    });

    if (errors || !dto) {
      return res.status(400).json({
        errors,
        errores: errors,
      });
    }

    try {
      const entity = await this.stlService.calculate(dto, res.locals.stlHash);
      return res.status(200).json(entity);
    } catch (error) {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          mensaje: error.message,
          error: error.message,
        });
      }

      console.error("Error inesperado al calcular el STL:", error);
      return res
        .status(500)
        .json({ mensaje: "Error interno al procesar el archivo STL." });
    }
  };
}
