import { CustomError, CustomNotFoundError } from "./custom.error.js";
import { StlValidationError, ModeloStlNotFoundError } from "./stl.errors.js";
import { MaterialNotFoundError, MaterialInactivoError } from "./material.errors.js";

export class InvalidCotizacionIdError extends CustomError {
  constructor() {
    super("El ID de la cotización debe ser un número entero positivo.", 400);
  }
}

export class CotizacionNotFoundError extends CustomError {
  constructor(id: number) {
    super(`No se encontró la cotización con ID ${id}.`, 404);
  }
}

export class CotizacionValidationError extends CustomError {
  constructor(message: string) {
    super(message, 400);
  }
}

export {
  CustomError,
  CustomNotFoundError,
  StlValidationError,
  ModeloStlNotFoundError,
  MaterialNotFoundError,
  MaterialInactivoError,
};
