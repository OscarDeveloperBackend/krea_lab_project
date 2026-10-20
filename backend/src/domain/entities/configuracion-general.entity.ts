export class ConfiguracionGeneralEntity {
  constructor(
    public readonly precioKwh: number,
    public readonly tarifaManoObraPorHora: number,
    public readonly setupPorDefecto: number,
    public readonly minutosManoObraPorDefecto: number,
    public readonly multiplicadorPrecioBase: number,
    public readonly porcentajeRangoInferior: number,
    public readonly porcentajeRangoSuperior: number,
    public readonly diasVencimiento: number,
  ) {}
}
