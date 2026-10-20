import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ConfiguracionInicialResponse } from '../models/configuracion.model';
import type {
  CotizacionBackendPayload,
  CotizacionDetail,
  PaginatedCotizaciones,
  StlAnalisisResponse,
} from '../models/cotizacion.model';

export interface CotizacionFiltros {
  search?: string;
  estado?: string;
  materialId?: number;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class CotizadorApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  loadConfiguracionInicial(): Observable<ConfiguracionInicialResponse> {
    return this.http.get<ConfiguracionInicialResponse>(`${this.base}/configuracion-inicial`);
  }

  analizarStl(file: File): Observable<StlAnalisisResponse> {
    const form = new FormData();
    form.append('archivo', file, file.name);
    return this.http.post<StlAnalisisResponse>(`${this.base}/stl-calculate`, form);
  }

  guardarCotizacion(payload: CotizacionBackendPayload): Observable<CotizacionDetail> {
    return this.http.post<CotizacionDetail>(`${this.base}/cotizaciones`, payload);
  }

  getCotizaciones(filtros: CotizacionFiltros = {}): Observable<PaginatedCotizaciones> {
    let params = new HttpParams();
    if (filtros.search) params = params.set('search', filtros.search);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.materialId) params = params.set('materialId', filtros.materialId.toString());
    if (filtros.page) params = params.set('page', filtros.page.toString());
    if (filtros.limit) params = params.set('limit', filtros.limit.toString());
    return this.http.get<PaginatedCotizaciones>(`${this.base}/cotizaciones`, { params });
  }

  getCotizacionById(id: number): Observable<CotizacionDetail> {
    return this.http.get<CotizacionDetail>(`${this.base}/cotizaciones/${id}`);
  }
}
