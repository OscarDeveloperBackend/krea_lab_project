import { CustomError } from "./custom.error.js";

export class StlValidationError extends CustomError {
  constructor(message: string) {
    super(message, 422);
  }
}

export class ModeloStlNotFoundError extends CustomError {
  constructor(hash: string) {
    super(`No se encontró el modelo STL con hash ${hash}. Debe procesarse antes de cotizar.`, 404);
  }
}
