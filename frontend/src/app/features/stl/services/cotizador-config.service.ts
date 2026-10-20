import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ConfiguracionInicialResponse,
  MaterialConfig,
  Tecnologia,
} from '../interfaces/configuracion-inicial.interface';
import {
  PiezasCalculoInput,
  PiezasCalculoResultado,
  StlAnalisisResponse,
} from '../interfaces/cotizacion.interface';

@Injectable({
  providedIn: 'root',
})
export class CotizadorConfigService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  loadConfiguracionInicial(): Observable<ConfiguracionInicialResponse> {
    return this.http.get<ConfiguracionInicialResponse>(`${this.apiBaseUrl}/configuracion-inicial`);
  }

  analizarStl(file: File): Observable<StlAnalisisResponse> {
    const formData = new FormData();
    formData.append('archivo', file, file.name);
    return this.http.post<StlAnalisisResponse>(`${this.apiBaseUrl}/stl-calculate`, formData);
  }

  calcularCostoPieza(input: PiezasCalculoInput): PiezasCalculoResultado {
    const horasTotales = input.horas + input.minutos / 60;
    const materialCost = (input.gramos / 1000) * input.precioPorKg;
    const electricCost =
      horasTotales * (input.maquina.consumoWatts / 1000) * input.configuracion.precioKwh;
    const desgasteMaquina =
      (input.maquina.costoMaquina / input.maquina.vidaUtilHoras) * horasTotales;
    const manoObraCost =
      ((input.horas * 60 + input.minutos) / 60) * input.configuracion.tarifaManoObraPorHora;
    const setupCost = input.setup ?? input.configuracion.setupPorDefecto;
    const costoPostProceso = input.maquina.costoPostProceso ?? 0;
    const mermaCost = this.calcularMerma(input, materialCost);
    const fallosCost = this.calcularFallos(
      input,
      materialCost + electricCost + desgasteMaquina + manoObraCost + setupCost + costoPostProceso,
    );
    const costoExtra = input.insumosExtra ?? 0;
    const costoDirecto =
      materialCost +
      electricCost +
      desgasteMaquina +
      manoObraCost +
      setupCost +
      costoExtra +
      mermaCost +
      fallosCost +
      costoPostProceso;

    const precioInicialSinRedondear = costoDirecto * input.configuracion.multiplicadorPrecioBase;
    const modoMultiplicador = input.configuracion.modoMultiplicador ?? 1;
    const precioMinimoSinRedondear =
      precioInicialSinRedondear *
      (1 + input.configuracion.porcentajeRangoInferior / 100) *
      modoMultiplicador;
    const precioMaximoSinRedondear =
      precioInicialSinRedondear *
      (1 + input.configuracion.porcentajeRangoSuperior / 100) *
      modoMultiplicador;
    const precioInicial = Math.ceil(precioInicialSinRedondear);
    const precioMinimo = Math.ceil(precioMinimoSinRedondear);
    const precioMaximo = Math.ceil(precioMaximoSinRedondear);
    const precioFinal = Math.ceil((precioMinimoSinRedondear + precioMaximoSinRedondear) / 2);
    const precioTotal = precioFinal * input.cantidad;

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
    return configuracion.materiales.filter((material) => material.tecnologia === tecnologia);
  }

  private calcularMerma(input: PiezasCalculoInput, materialCost: number): number {
    if (input.tecnologia === 'FILAMENTO') {
      return 0;
    }

    const porcentaje = input.maquina.porcentajeMerma ?? 0;
    return materialCost * (porcentaje / 100);
  }

  private calcularFallos(input: PiezasCalculoInput, base: number): number {
    if (input.tecnologia === 'RESINA') {
      const porcentaje = input.maquina.porcentajeFallos ?? 0;
      return base * (porcentaje / 100);
    }

    return 0;
  }
}
