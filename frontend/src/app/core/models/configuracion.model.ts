export type Tecnologia = 'FILAMENTO' | 'RESINA';

export interface GeneralConfig {
  precioKwh: number;
  tarifaManoObraPorHora: number;
  setupPorDefecto: number;
  minutosManoObraPorDefecto: number;
  multiplicadorPrecioBase: number;
  porcentajeRangoInferior: number;
  porcentajeRangoSuperior: number;
  diasVencimiento: number;
}

export interface MaquinaConfig {
  nombreMaquina: string | null;
  consumoWatts: number;
  vidaUtilHoras: number;
  costoMaquina: number;
  camaXMm: number;
  camaYMm: number;
  camaZMm: number;
  porcentajeMerma: number | null;
  porcentajeFallos: number | null;
  costoPostProceso: number | null;
}

export interface MaterialConfig {
  id: number;
  tecnologia: Tecnologia;
  nombre: string;
  marca: string | null;
  precioPorKg: number;
  densidadGramosCm3: number;
}

export interface ModoConfig {
  valor: string;
  nombre: string;
  multiplicador: number;
  plazoEntrega: string;
}

export interface ConfiguracionInicialResponse {
  general: GeneralConfig;
  maquinas: Record<string, MaquinaConfig>;
  materiales: MaterialConfig[];
  modos: ModoConfig[];
}
