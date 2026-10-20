import type { MaterialesEntity } from "../domain/entities/index.js";
import { CustomNotFoundError } from "../domain/errors/cotizacion.errors.js";
import { MaterialRepository } from "../repositories/index.js";

export class MaterialService {
  constructor(private readonly materialRepository = new MaterialRepository()) {}

  async getAll(): Promise<MaterialesEntity[]> {
    const materiales = await this.materialRepository.getAll();
    if (materiales.length === 0) {
      throw new CustomNotFoundError("No hay materiales activos");
    }
    return materiales;
  }
}
