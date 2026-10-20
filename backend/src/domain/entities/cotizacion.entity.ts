export interface CotizacionModoEntregaEntity {
  modo: string;
  multiplicador: number;
  plazoEntrega: string;
}

export interface CotizacionConfiguracionEntity {
  precioKwh: number;
  tarifaManoObraPorHora: number;
  multiplicadorPrecioBase: number;
  porcentajeRangoInferior: number;
  porcentajeRangoSuperior: number;
  maquinas: Record<string, unknown>;
}

export interface CotizacionModeloStlDetail {
  id: number;
  hash: string;
  nombreArchivo: string;
  tamanoBytes: number;
  formato: string;
  cantidadTriangulos: number;
  volumenCm3: number;
  areaMm2: number;
  dimensionXMm: number;
  dimensionYMm: number;
  dimensionZMm: number;
  esMallaCerrada: boolean;
}

export interface CotizacionMaterialDetail {
  id: number;
  nombre: string;
  marca: string | null;
  precioPorKg: number;
}

export interface CotizacionDesgloseCostosDetail {
  gramosConMermaPorUnidad: number | null;
  costoMaterial: number;
  costoElectricidad: number;
  costoDesgasteMaquina: number;
  costoManoObra: number;
  costoSetup: number;
  costoInsumosExtra: number;
  costoPostProceso: number | null;
  costoFallos: number | null;
  costoDirectoPorUnidad: number;
}

export interface CotizacionPreciosDetail {
  precioInicialPorUnidad: number;
  precioMinimoPorUnidad: number;
  precioMaximoPorUnidad: number;
  precioFinalPorUnidad: number;
  precioFinalTotal: number;
}

export class CotizacionPiezaDetailEntity {
  constructor(
    public readonly id: number,
    public readonly modeloStl: CotizacionModeloStlDetail,
    public readonly tecnologia: string,
    public readonly material: CotizacionMaterialDetail,
    public readonly rellenoPorcentaje: number | null,
    public readonly gramosPorUnidad: number,
    public readonly horasPorUnidad: number,
    public readonly minutosManoObraPorUnidad: number,
    public readonly setupPorUnidad: number,
    public readonly insumosExtraPorUnidad: number,
    public readonly cantidad: number,
    public readonly desgloseCostos: CotizacionDesgloseCostosDetail,
    public readonly precios: CotizacionPreciosDetail,
  ) {}
}

export class CotizacionDetailEntity {
  constructor(
    public readonly id: number,
    public readonly nombreCliente: string,
    public readonly telefonoCliente: string,
    public readonly correoCliente: string | null,
    public readonly nombrePedido: string | null,
    public readonly comentarioPedido: string | null,
    public readonly urlPdf: string | null,
    public readonly estado: string,
    public readonly venceEl: Date,
    public readonly modoEntrega: CotizacionModoEntregaEntity,
    public readonly configuracion: CotizacionConfiguracionEntity,
    public readonly precioTotal: number,
    public readonly piezas: CotizacionPiezaDetailEntity[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
