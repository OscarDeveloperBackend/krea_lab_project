import { createHash } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import type { StlService } from "../../services/stl.service.js";

export class StlDeduplicationMiddleware {
  static check(stlService: StlService) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.file) {
        return res
          .status(400)
          .json({ errores: { archivo: "Falta adjuntar el archivo STL." } });
      }

      const hash = createHash("sha256").update(req.file.buffer).digest("hex");
      res.locals.stlHash = hash;

      try {
        const existingModel = await stlService.findByHash(hash);
        if (existingModel) {
          return res.status(200).json(existingModel);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
