import { Injectable } from '@angular/core';
import type {
  ConfiguracionInicialResponse,
  MaterialConfig,
  Tecnologia,
} from '../../core/models/configuracion.model';
import type {
  PiezasCalculoInput,
  PiezasCalculoResultado,
} from '../../core/models/cotizacion.model';

@Injectable({ providedIn: 'root' })
export class PrecioCalculatorService {
  calcularCostoPieza(input: PiezasCalculoInput): PiezasCalculoResultado {
    const horasImpresion = input.horas;

    let costoMaterial = 0;
    let costoPostProceso = 0;
    let costoFallos = 0;

    if (input.tecnologia === 'RESINA') {
      const mermaPct = input.maquina.porcentajeMerma ?? 0;
      const gramosConMerma = input.gramos * (1 + mermaPct / 100);
      costoMaterial = (gramosConMerma / 1000) * input.precioPorKg;
      costoPostProceso = input.maquina.costoPostProceso ?? 0;
    } else {
      costoMaterial = (input.gramos / 1000) * input.precioPorKg;
    }

    const costoElectricidad =
      horasImpresion * (input.maquina.consumoWatts / 1000) * input.configuracion.precioKwh;

    const costoDesgaste =
      input.maquina.vidaUtilHoras > 0
        ? horasImpresion * (input.maquina.costoMaquina / input.maquina.vidaUtilHoras)
        : 0;

    const costoManoObra =
      (input.minutos / 60) * input.configuracion.tarifaManoObraPorHora;

    const costoSetup = input.setup ?? input.configuracion.setupPorDefecto;
    const costoExtra = input.insumosExtra ?? 0;

    if (input.tecnologia === 'RESINA') {
      const subtotal =
        costoMaterial +
        costoElectricidad +
        costoDesgaste +
        costoManoObra +
        costoSetup +
        costoExtra +
        costoPostProceso;
      costoFallos = subtotal * ((input.maquina.porcentajeFallos ?? 0) / 100);
    }

    const costoDirecto =
      costoMaterial +
      costoElectricidad +
      costoDesgaste +
      costoManoObra +
      costoSetup +
      costoExtra +
      costoPostProceso +
      costoFallos;

    // — Precios redondeados con Math.round() para consistencia exacta con backend —
    const modoMult = input.configuracion.modoMultiplicador ?? 1;
    const precioInicial = Math.round(
      costoDirecto * input.configuracion.multiplicadorPrecioBase * modoMult,
    );
    const precioMinimo = Math.round(
      precioInicial * (1 - input.configuracion.porcentajeRangoInferior / 100),
    );
    const precioMaximo = Math.round(
      precioInicial * (1 + input.configuracion.porcentajeRangoSuperior / 100),
    );
    const precioFinal = Math.round((precioMinimo + precioMaximo) / 2);
    const precioTotal = Math.round(precioFinal) * input.cantidad;

    return {
      costoTotal: costoDirecto,
      precioInicial,
      precioMinimo,
      precioMaximo,
      precioFinal,
      precioTotal,
    };
  }

  estimarGramosDesdeStl(volumenCm3: number, densidadGramosCm3: number): number {
    return volumenCm3 * densidadGramosCm3;
  }

  getMaterialesPorTecnologia(
    configuracion: ConfiguracionInicialResponse,
    tecnologia: Tecnologia,
  ): MaterialConfig[] {
    return configuracion.materiales.filter((m) => m.tecnologia === tecnologia);
  }
}
