import type { Request, Response, NextFunction } from "express";
import multer from "multer";

const storage = multer.memoryStorage();
const MAX_STL_FILE_SIZE = 50 * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: MAX_STL_FILE_SIZE, files: 1 },

  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".stl")) {
      return cb(new Error("Solo se permiten archivos con extensión .stl."));
    }

    cb(null, true);
  },
}).single("archivo");

export class FileUploadMiddleware {
  /** Recibe un único archivo STL en memoria y responde en español si la carga falla. */
  static processStl = (req: Request, res: Response, next: NextFunction) => {
    console.log("Archivo recibido, analizando...");
    upload(req, res, (err) => {
      if (err) {
        const mensaje =
          err.code === "LIMIT_FILE_SIZE"
            ? "El archivo STL supera el límite permitido de 50 MiB."
            : err.message;
        return res.status(400).json({ errores: { archivo: mensaje } });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ errores: { archivo: "Falta adjuntar el archivo STL." } });
      }

      next();
    });
  };
}
