import type { ConfiguracionGeneralEntity } from "./configuracion-general.entity.js";

export interface MaquinaConfiguracionInicial {
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

export interface MaterialConfiguracionInicial {
  id: number;
  tecnologia: "FILAMENTO" | "RESINA";
  nombre: string;
  marca: string | null;
  precioPorKg: number;
  densidadGramosCm3: number;
}

export interface ModoEntregaConfiguracionInicial {
  valor: "NOCTURNO" | "DIURNO" | "EXPRESS";
  nombre: string;
  multiplicador: number;
  plazoEntrega: string;
}

export class ConfiguracionInicialEntity {
  constructor(
    public readonly general: ConfiguracionGeneralEntity,
    public readonly maquinas: Record<string, MaquinaConfiguracionInicial>,
    public readonly materiales: MaterialConfiguracionInicial[],
    public readonly modos: ModoEntregaConfiguracionInicial[],
  ) {}
}
