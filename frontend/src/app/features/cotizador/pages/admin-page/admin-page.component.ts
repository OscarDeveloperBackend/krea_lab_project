import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CotizacionModalComponent } from '../../components/cotizacion-modal/cotizacion-modal.component';
import type { MaterialConfig } from '../../../../core/models/configuracion.model';
import type {
  CotizacionDetail,
  CotizacionListItem,
} from '../../../../core/models/cotizacion.model';
import { CotizadorApiService } from '../../../../core/services/cotizador-api.service';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [ReactiveFormsModule, SlicePipe, CotizacionModalComponent],
  templateUrl: './admin-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageComponent implements OnInit {
  private readonly api = inject(CotizadorApiService);

  // — Estados Signals —
  readonly cotizaciones = signal<CotizacionListItem[]>([]);
  readonly materiales = signal<MaterialConfig[]>([]);
  readonly totalItems = signal(0);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);
  readonly pageSize = signal(10);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // — Modal de Detalle —
  readonly selectedCotizacion = signal<CotizacionDetail | null>(null);
  readonly isModalOpen = signal(false);
  readonly isModalLoading = signal(false);

  // — Formulario Reactivo de Filtros (3 filtros requeridos) —
  readonly filtrosForm = new FormGroup({
    search: new FormControl(''),
    estado: new FormControl(''),
    materialId: new FormControl<string>(''),
  });

  readonly hasActiveFilters = computed(() => {
    const v = this.filtrosForm.value;
    return !!(v.search?.trim() || v.estado || v.materialId);
  });

  private parseMaterialId(val: string | null | undefined): number | undefined {
    if (!val || val === '') return undefined;
    const num = Number(val);
    return Number.isFinite(num) && num > 0 ? num : undefined;
  }

  ngOnInit(): void {
    this.cargarMateriales();
    this.cargarCotizaciones();

    this.filtrosForm.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage.set(1);
        this.cargarCotizaciones();
      });
  }

  cargarMateriales(): void {
    this.api.loadConfiguracionInicial().subscribe({
      next: (cfg) => this.materiales.set(cfg.materiales ?? []),
      error: () => console.warn('No se pudieron precargar los materiales para los filtros'),
    });
  }

  cargarCotizaciones(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const f = this.filtrosForm.value;
    const searchVal = f.search?.trim();
    const estadoVal = f.estado?.trim();
    const materialVal = this.parseMaterialId(f.materialId);

    this.api
      .getCotizaciones({
        search: searchVal || undefined,
        estado: estadoVal || undefined,
        materialId: materialVal,
        page: this.currentPage(),
        limit: this.pageSize(),
      })
      .subscribe({
        next: (resp) => {
          this.cotizaciones.set(resp.data);
          this.totalItems.set(resp.meta.total);
          this.totalPages.set(resp.meta.totalPages);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          const errData = err?.error ?? {};
          const msg =
            errData.mensaje ??
            (errData.errores ? Object.values(errData.errores).join(' · ') : null) ??
            'Error al conectar con la base de datos de cotizaciones.';
          this.setErrorConTimer(msg);
        },
      });
  }

  cambiarPagina(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.cargarCotizaciones();
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({ search: '', estado: '', materialId: '' });
  }

  verDetalle(id: number): void {
    this.isModalOpen.set(true);
    this.isModalLoading.set(true);
    this.selectedCotizacion.set(null);

    this.api.getCotizacionById(id).subscribe({
      next: (detail) => {
        this.selectedCotizacion.set(detail);
        this.isModalLoading.set(false);
      },
      error: (err) => {
        this.isModalLoading.set(false);
        const errData = err?.error ?? {};
        const msg = errData.mensaje ?? 'No se pudo cargar el detalle de la cotización.';
        this.setErrorConTimer(msg);
        this.isModalOpen.set(false);
      },
    });
  }

  cerrarModal(): void {
    this.isModalOpen.set(false);
    this.selectedCotizacion.set(null);
  }

  private setErrorConTimer(msg: string | null): void {
    this.errorMessage.set(msg);
    if (msg) {
      setTimeout(() => this.errorMessage.set(null), 3000);
    }
  }
}
