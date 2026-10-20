import { CustomError } from "./custom.error.js";

export class MaterialNotFoundError extends CustomError {
  constructor(id: number) {
    super(`No se encontró el material con ID ${id}.`, 404);
  }
}

export class MaterialInactivoError extends CustomError {
  constructor(nombre: string) {
    super(`El material "${nombre}" no se encuentra activo para cotización.`, 400);
  }
}
