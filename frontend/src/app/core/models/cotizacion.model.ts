import type { Tecnologia } from './configuracion.model';

export interface StlAnalisisResponse {
  hash: string;
  nombreArchivo: string;
  sizeFile: number;
  formato: string;
  claveAlmacenamiento: string;
  cantidadTriangulos: number;
  volumen: number;
  area: number;
  dimensionX: number;
  dimensionY: number;
  dimensionZ: number;
  esMallaCerrada: boolean;
}

export interface CotizacionPieza {
  id: string;
  modeloHash: string;
  nombreArchivo: string;
  tecnologia: Tecnologia;
  materialId: number;
  nombreMaterial: string;
  precioPorKg: number;
  gramos: number;
  horas: number;
  minutos: number;
  cantidad: number;
  setup: number;
  relleno: number | null;
  insumosExtra: number;
  costoTotal: number;
  precioInicial: number;
  precioMinimo: number;
  precioMaximo: number;
  precioFinal: number;
  precioTotal: number;
  modo: string;
}

export interface CotizacionBackendPayload {
  nombreCliente: string;
  telefonoCliente: string;
  correoCliente: string | null;
  nombrePedido: string;
  comentarioPedido: string | null;
  modoEntrega: string;
  configuracion: {
    precioKwh: number;
    tarifaManoObraPorHora: number;
    multiplicadorPrecioBase: number;
    porcentajeRangoInferior: number;
    porcentajeRangoSuperior: number;
    maquinas: Record<string, Record<string, number>>;
  };
  piezas: Array<{
    modeloHash: string;
    tecnologia: Tecnologia;
    materialId: number;
    rellenoPorcentaje: number | null;
    gramosPorUnidad: number;
    horasPorUnidad: number;
    minutosManoObraPorUnidad: number;
    setupPorUnidad: number;
    insumosExtraPorUnidad: number;
    cantidad: number;
    precioFinalPorUnidad: number;
  }>;
}

export interface PiezasCalculoInput {
  tecnologia: Tecnologia;
  materialId: number;
  nombreMaterial: string;
  precioPorKg: number;
  gramos: number;
  horas: number;
  minutos: number;
  cantidad: number;
  setup: number;
  insumosExtra: number;
  relleno: number | null;
  configuracion: {
    precioKwh: number;
    tarifaManoObraPorHora: number;
    setupPorDefecto: number;
    multiplicadorPrecioBase: number;
    porcentajeRangoInferior: number;
    porcentajeRangoSuperior: number;
    modoMultiplicador: number;
  };
  maquina: {
    consumoWatts: number;
    vidaUtilHoras: number;
    costoMaquina: number;
    porcentajeMerma: number | null;
    porcentajeFallos: number | null;
    costoPostProceso: number | null;
  };
}

export interface PiezasCalculoResultado {
  costoTotal: number;
  precioInicial: number;
  precioMinimo: number;
  precioMaximo: number;
  precioFinal: number;
  precioTotal: number;
}

export interface CotizacionListItem {
  id: number;
  nombreCliente: string;
  telefonoCliente: string;
  correoCliente: string | null;
  nombrePedido: string | null;
  estado: string;
  modoEntrega: string;
  cantidadPiezas: number;
  materiales: string[];
  precioTotal: number;
  venceEl: string;
  createdAt: string;
}

export interface PaginatedCotizaciones {
  data: CotizacionListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CotizacionDetail {
  id: number;
  nombreCliente: string;
  telefonoCliente: string;
  correoCliente: string | null;
  nombrePedido: string | null;
  comentarioPedido: string | null;
  estado: string;
  venceEl: string;
  modoEntrega: {
    modo: string;
    multiplicador: number;
    plazoEntrega: string;
  };
  configuracion: {
    precioKwh: number;
    tarifaManoObraPorHora: number;
    multiplicadorPrecioBase: number;
    porcentajeRangoInferior: number;
    porcentajeRangoSuperior: number;
    maquinas: Record<string, unknown>;
  };
  precioTotal: number;
  piezas: CotizacionPiezaDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface CotizacionPiezaDetail {
  id: number;
  modeloStl: {
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
  };
  tecnologia: string;
  material: {
    id: number;
    nombre: string;
    marca: string | null;
    precioPorKg: number;
  };
  rellenoPorcentaje: number | null;
  gramosPorUnidad: number;
  horasPorUnidad: number;
  minutosManoObraPorUnidad: number;
  setupPorUnidad: number;
  insumosExtraPorUnidad: number;
  cantidad: number;
  desgloseCostos: {
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
  };
  precios: {
    precioInicialPorUnidad: number;
    precioMinimoPorUnidad: number;
    precioMaximoPorUnidad: number;
    precioFinalPorUnidad: number;
    precioFinalTotal: number;
  };
}
