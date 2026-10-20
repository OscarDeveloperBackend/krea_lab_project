export type TecnologiaMaterial = "FILAMENTO" | "RESINA";

export class MaterialesEntity {
  constructor(
    public readonly id: number,
    public readonly tecnologia: TecnologiaMaterial,
    public readonly nombre: string,
    public readonly marca: string | null,
    public readonly precioKg: number,
    public readonly densidadGramosCm3: number,
    public readonly estado: boolean,
  ) {}
}
