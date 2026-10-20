import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith, tap } from 'rxjs';
import { ConfiguracionGeneralComponent } from '../../components/configuracion-general.component/configuracion-general.component';
import { CotizacionesListComponent } from '../../components/cotizaciones-list.component/cotizaciones-list.component';
import { FormStlComponent } from '../../components/form-stl.component/form-stl.component';
import { Stl3dModel } from '../../components/stl-3d-model/stl-3d-model';
import type {
  ConfiguracionInicialResponse,
  Tecnologia,
} from '../../../../core/models/configuracion.model';
import type {
  CotizacionBackendPayload,
  CotizacionPieza,
  StlAnalisisResponse,
} from '../../../../core/models/cotizacion.model';
import { CotizadorApiService } from '../../../../core/services/cotizador-api.service';
import { PrecioCalculatorService } from '../../../../shared/services/precio-calculator.service';

@Component({
  selector: 'app-cotizador-principal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ConfiguracionGeneralComponent,
    FormStlComponent,
    CotizacionesListComponent,
    Stl3dModel,
  ],
  templateUrl: './cotizador-principal.html',
})
export class CotizadorPrincipal implements OnInit {
  private readonly api = inject(CotizadorApiService);
  private readonly calculator = inject(PrecioCalculatorService);

  // — Estados Signals reactivos —
  readonly configuracion = signal<ConfiguracionInicialResponse | null>(null);
  readonly selectedMode = signal<string>('NOCTURNO');
  readonly selectedTechnology = signal<Tecnologia>('FILAMENTO');
  readonly piezas = signal<CotizacionPieza[]>([]);
  readonly stlData = signal<StlAnalisisResponse | null>(null);
  readonly stlUrl = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isAnalyzingStl = signal(false);
  readonly isSaving = signal(false);
  readonly finalPriceOverride = signal<number | null>(null);
  readonly mostrarExito = signal(false);
  readonly errorGuardado = signal<string | null>(null);

  // — Formulario Cliente —
  readonly clienteForm = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.email]),
    whatsapp: new FormControl('', [Validators.required, Validators.pattern(/^\+?[\d\s\-]{7,20}$/)]),
    nombrePaquete: new FormControl('', [Validators.required, Validators.minLength(2)]),
    comentarioPedido: new FormControl(''),
  });

  private readonly clienteFormStatus = toSignal(
    this.clienteForm.statusChanges.pipe(startWith(this.clienteForm.status)),
    { initialValue: this.clienteForm.status },
  );

  // — Formulario Pieza —
  readonly piezaForm = new FormGroup({
    materialId: new FormControl<string>('', [Validators.required]),
    relleno: new FormControl<number | null>(20, [Validators.min(0), Validators.max(100)]),
    gramos: new FormControl<number>(10, [Validators.required, Validators.min(1)]),
    horas: new FormControl<number>(1, [Validators.min(0)]),
    minutos: new FormControl<number>(0, [Validators.min(0), Validators.max(59)]),
    cantidad: new FormControl<number>(1, [Validators.required, Validators.min(1)]),
    setup: new FormControl<number>(10, [Validators.min(0)]),
    insumosExtra: new FormControl<number>(0, [Validators.min(0)]),
    nombreArchivo: new FormControl<string>(''),
  });

  private readonly piezaFormValue = toSignal(
    this.piezaForm.valueChanges.pipe(
      tap(() => this.finalPriceOverride.set(null)),
      startWith(this.piezaForm.getRawValue()),
    ),
    { initialValue: this.piezaForm.getRawValue() },
  );

  // — Computeds —
  readonly materialesPorTecnologia = computed(() => {
    const cfg = this.configuracion();
    return cfg ? this.calculator.getMaterialesPorTecnologia(cfg, this.selectedTechnology()) : [];
  });

  readonly currentPreview = computed(() => {
    const cfg = this.configuracion();
    const formVal = this.piezaFormValue();
    const material = this.materialesPorTecnologia().find(
      (m) => m.id === Number(formVal.materialId ?? 0),
    );
    const modo = cfg?.modos.find((m) => m.valor === this.selectedMode()) ?? cfg?.modos[0];
    const maquina = cfg?.maquinas[this.selectedTechnology()];

    if (!cfg || !material || !modo || !maquina) return null;

    const stl = this.stlData();
    const gramos =
      stl && stl.volumen > 0
        ? this.calculator.estimarGramosDesdeStl(stl.volumen, material.densidadGramosCm3)
        : Number(formVal.gramos ?? 0);

    const preview = this.calculator.calcularCostoPieza({
      tecnologia: this.selectedTechnology(),
      materialId: material.id,
      nombreMaterial: material.nombre,
      precioPorKg: material.precioPorKg,
      gramos,
      horas: Number(formVal.horas ?? 0),
      minutos: Number(formVal.minutos ?? 0),
      cantidad: Number(formVal.cantidad ?? 1),
      setup: Number(formVal.setup ?? cfg.general.setupPorDefecto),
      insumosExtra: Number(formVal.insumosExtra ?? 0),
      relleno: Number(formVal.relleno ?? 0),
      configuracion: {
        precioKwh: cfg.general.precioKwh,
        tarifaManoObraPorHora: cfg.general.tarifaManoObraPorHora,
        setupPorDefecto: cfg.general.setupPorDefecto,
        multiplicadorPrecioBase: cfg.general.multiplicadorPrecioBase,
        porcentajeRangoInferior: cfg.general.porcentajeRangoInferior,
        porcentajeRangoSuperior: cfg.general.porcentajeRangoSuperior,
        modoMultiplicador: modo.multiplicador,
      },
      maquina: {
        consumoWatts: maquina.consumoWatts,
        vidaUtilHoras: maquina.vidaUtilHoras,
        costoMaquina: maquina.costoMaquina,
        porcentajeMerma: maquina.porcentajeMerma,
        porcentajeFallos: maquina.porcentajeFallos,
        costoPostProceso: maquina.costoPostProceso,
      },
    });

    return {
      ...preview,
      gramos,
      material,
      modo,
      nombreArchivo: stl?.nombreArchivo ?? formVal.nombreArchivo ?? 'pieza.stl',
    };
  });

  readonly precioActual = computed(() => {
    const preview = this.currentPreview();
    if (!preview) return 0;
    return this.finalPriceOverride() ?? preview.precioFinal;
  });

  readonly totalCotizacion = computed(() =>
    this.piezas().reduce((total, p) => total + p.precioTotal, 0),
  );

  readonly puedeGuardar = computed(
    () => this.clienteFormStatus() === 'VALID' && this.piezas().length > 0 && !!this.configuracion(),
  );

  ngOnInit(): void {
    this.api.loadConfiguracionInicial().subscribe({
      next: (cfg) => {
        this.configuracion.set(cfg);
        this.selectedMode.set(cfg.modos[0]?.valor ?? 'NOCTURNO');
        const mat = this.calculator.getMaterialesPorTecnologia(cfg, 'FILAMENTO')[0];
        this.piezaForm.patchValue({
          materialId: mat?.id?.toString() ?? '',
          relleno: 20,
          gramos: 10,
          horas: 1,
          minutos: 0,
          cantidad: 1,
          setup: cfg.general.setupPorDefecto,
          insumosExtra: 0,
        });
      },
      error: () => this.setErrorConTimer('No se pudo cargar la configuración inicial desde la API.'),
    });
  }

  onModoChange(modo: string): void {
    this.selectedMode.set(modo);
    this.finalPriceOverride.set(null);
    this.recalcularPiezas();
  }

  onTecnologiaChange(tecnologia: Tecnologia): void {
    this.selectedTechnology.set(tecnologia);
    this.finalPriceOverride.set(null);
    const rellenoCtrl = this.piezaForm.controls.relleno;
    if (tecnologia === 'RESINA') {
      rellenoCtrl.setValue(null);
      rellenoCtrl.disable();
    } else {
      rellenoCtrl.enable();
      rellenoCtrl.setValue(20);
    }
    this.piezaForm.patchValue({ materialId: this.materialesPorTecnologia()[0]?.id?.toString() ?? '' });
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    const prevUrl = this.stlUrl();
    if (prevUrl) URL.revokeObjectURL(prevUrl);
    this.stlData.set(null);
    this.stlUrl.set(null);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.stl')) {
      this.setErrorConTimer('El archivo seleccionado no es un STL válido.');
      return;
    }

    this.isAnalyzingStl.set(true);
    this.errorMessage.set(null);

    this.api.analizarStl(file).subscribe({
      next: (res) => {
        this.isAnalyzingStl.set(false);
        const payload = res as Partial<StlAnalisisResponse> & {
          mensaje?: string;
          errores?: Record<string, string>;
          error?: string;
        };
        const errMsg =
          payload.mensaje ??
          payload.error ??
          Object.values(payload.errores ?? {})[0] ??
          null;

        if (errMsg || !payload.nombreArchivo) {
          this.setErrorConTimer(errMsg ?? 'La validación del STL no devolvió información válida.');
          return;
        }

        this.stlData.set(payload as StlAnalisisResponse);
        this.stlUrl.set(URL.createObjectURL(file));
        this.piezaForm.patchValue({ nombreArchivo: payload.nombreArchivo });
      },
      error: (httpError) => {
        this.isAnalyzingStl.set(false);
        const e = (httpError?.error ?? {}) as {
          mensaje?: string;
          error?: string;
          errores?: Record<string, string>;
        };
        this.setErrorConTimer(
          e.mensaje ??
            e.error ??
            Object.values(e.errores ?? {})[0] ??
            'No se pudo analizar el archivo STL.',
        );
        this.stlData.set(null);
        this.stlUrl.set(null);
      },
    });
  }

  onAgregarPieza(): void {
    const cfg = this.configuracion();
    const preview = this.currentPreview();
    const material = this.materialesPorTecnologia().find(
      (m) => m.id === Number(this.piezaForm.get('materialId')?.value ?? 0),
    );

    if (!cfg || !this.stlData() || !material || !preview) return;

    const cantidad = Number(this.piezaForm.get('cantidad')?.value ?? 1);
    const precioFinal = Math.round(this.precioActual());
    const precioTotal = precioFinal * cantidad;

    const nuevaPieza: CotizacionPieza = {
      id: crypto.randomUUID(),
      modeloHash: this.stlData()!.hash,
      nombreArchivo: preview.nombreArchivo,
      tecnologia: this.selectedTechnology(),
      materialId: material.id,
      nombreMaterial: material.nombre,
      precioPorKg: material.precioPorKg,
      gramos: preview.gramos,
      horas: Number(this.piezaForm.get('horas')?.value ?? 0),
      minutos: Number(this.piezaForm.get('minutos')?.value ?? 0),
      cantidad,
      setup: Number(this.piezaForm.get('setup')?.value ?? cfg.general.setupPorDefecto),
      relleno:
        this.selectedTechnology() === 'RESINA'
          ? null
          : Number(this.piezaForm.get('relleno')?.value ?? 0),
      insumosExtra: Number(this.piezaForm.get('insumosExtra')?.value ?? 0),
      costoTotal: preview.costoTotal,
      precioInicial: preview.precioInicial,
      precioMinimo: preview.precioMinimo,
      precioMaximo: preview.precioMaximo,
      precioFinal,
      precioTotal,
      modo: this.selectedMode(),
    };

    this.piezas.update((prev) => [...prev, nuevaPieza]);
    this.finalPriceOverride.set(null);
    this.errorMessage.set(null);
  }

  onEliminarPieza(id: string): void {
    this.piezas.update((prev) => prev.filter((p) => p.id !== id));
  }

  onGuardarCotizacion(): void {
    const cfg = this.configuracion();
    if (!cfg || !this.puedeGuardar()) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const cliente = this.clienteForm.getRawValue();
    const payload: CotizacionBackendPayload = {
      nombreCliente: cliente.nombre?.trim() ?? '',
      telefonoCliente: cliente.whatsapp?.trim() ?? '',
      correoCliente: cliente.email?.trim() || null,
      nombrePedido: cliente.nombrePaquete?.trim() ?? '',
      comentarioPedido: cliente.comentarioPedido?.trim() || null,
      modoEntrega: this.selectedMode(),
      configuracion: {
        precioKwh: cfg.general.precioKwh,
        tarifaManoObraPorHora: cfg.general.tarifaManoObraPorHora,
        multiplicadorPrecioBase: cfg.general.multiplicadorPrecioBase,
        porcentajeRangoInferior: Math.abs(cfg.general.porcentajeRangoInferior),
        porcentajeRangoSuperior: Math.abs(cfg.general.porcentajeRangoSuperior),
        maquinas: Object.fromEntries(
          Object.entries(cfg.maquinas).map(([tec, maq]) => [
            tec,
            {
              consumoWatts: maq.consumoWatts,
              vidaUtilHoras: maq.vidaUtilHoras,
              costoMaquina: maq.costoMaquina,
              ...(tec === 'RESINA'
                ? {
                    porcentajeMerma: maq.porcentajeMerma ?? 0,
                    porcentajeFallos: maq.porcentajeFallos ?? 0,
                    costoPostProceso: maq.costoPostProceso ?? 0,
                  }
                : {}),
            },
          ]),
        ) as any,
      },
      piezas: this.piezas().map((p) => ({
        modeloHash: p.modeloHash,
        tecnologia: p.tecnologia,
        materialId: p.materialId,
        rellenoPorcentaje: p.tecnologia === 'FILAMENTO' ? p.relleno : null,
        gramosPorUnidad: p.gramos,
        horasPorUnidad: p.horas,
        minutosManoObraPorUnidad: p.minutos,
        setupPorUnidad: p.setup,
        insumosExtraPorUnidad: p.insumosExtra,
        cantidad: p.cantidad,
        precioFinalPorUnidad: p.precioFinal,
      })),
    };

    this.isSaving.set(true);
    this.errorGuardado.set(null);

    this.api.guardarCotizacion(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.limpiarPedido();
        this.mostrarExito.set(true);
      },
      error: (err) => {
        this.isSaving.set(false);
        const e = (err?.error ?? {}) as {
          mensaje?: string;
          errores?: Record<string, string>;
        };
        this.setErrorGuardadoConTimer(
          e.mensaje ?? Object.values(e.errores ?? {})[0] ?? 'Error al guardar la cotización.',
        );
      },
    });
  }

  cerrarExito(): void {
    this.mostrarExito.set(false);
  }

  updatePrecioFinalManual(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const preview = this.currentPreview();
    if (!preview || !Number.isFinite(value)) return;
    this.finalPriceOverride.set(
      Math.round(Math.min(preview.precioMaximo, Math.max(preview.precioMinimo, value))),
    );
  }

  onConfiguracionChange(cfg: ConfiguracionInicialResponse): void {
    this.configuracion.set(cfg);
    if (!cfg.modos.some((m) => m.valor === this.selectedMode())) {
      this.selectedMode.set(cfg.modos[0]?.valor ?? '');
    }
    this.finalPriceOverride.set(null);
    this.recalcularPiezas();
  }

  private setErrorConTimer(msg: string | null): void {
    this.errorMessage.set(msg);
    if (msg) {
      setTimeout(() => this.errorMessage.set(null), 3000);
    }
  }

  private setErrorGuardadoConTimer(msg: string | null): void {
    this.errorGuardado.set(msg);
    if (msg) {
      setTimeout(() => this.errorGuardado.set(null), 3000);
    }
  }

  private recalcularPiezas(): void {
    const cfg = this.configuracion();
    if (!cfg) return;

    this.piezas.set(
      this.piezas().map((pieza) => {
        const material = cfg.materiales.find((m) => m.id === pieza.materialId);
        const maquina = cfg.maquinas[pieza.tecnologia];
        const modo = cfg.modos.find((m) => m.valor === this.selectedMode()) ?? cfg.modos[0];
        if (!material || !maquina || !modo) return pieza;

        const res = this.calculator.calcularCostoPieza({
          tecnologia: pieza.tecnologia,
          materialId: material.id,
          nombreMaterial: material.nombre,
          precioPorKg: material.precioPorKg,
          gramos: pieza.gramos,
          horas: pieza.horas,
          minutos: pieza.minutos,
          cantidad: pieza.cantidad,
          setup: pieza.setup,
          insumosExtra: pieza.insumosExtra,
          relleno: pieza.relleno,
          configuracion: {
            precioKwh: cfg.general.precioKwh,
            tarifaManoObraPorHora: cfg.general.tarifaManoObraPorHora,
            setupPorDefecto: cfg.general.setupPorDefecto,
            multiplicadorPrecioBase: cfg.general.multiplicadorPrecioBase,
            porcentajeRangoInferior: cfg.general.porcentajeRangoInferior,
            porcentajeRangoSuperior: cfg.general.porcentajeRangoSuperior,
            modoMultiplicador: modo.multiplicador,
          },
          maquina: {
            consumoWatts: maquina.consumoWatts,
            vidaUtilHoras: maquina.vidaUtilHoras,
            costoMaquina: maquina.costoMaquina,
            porcentajeMerma: maquina.porcentajeMerma,
            porcentajeFallos: maquina.porcentajeFallos,
            costoPostProceso: maquina.costoPostProceso,
          },
        });

        return { ...pieza, ...res };
      }),
    );
  }

  private limpiarPedido(): void {
    const url = this.stlUrl();
    if (url) URL.revokeObjectURL(url);

    this.piezas.set([]);
    this.clienteForm.reset({
      nombre: '',
      email: '',
      whatsapp: '',
      nombrePaquete: '',
      comentarioPedido: '',
    });
    this.stlData.set(null);
    this.stlUrl.set(null);
    this.errorMessage.set(null);
    this.isAnalyzingStl.set(false);
    this.finalPriceOverride.set(null);
    this.selectedTechnology.set('FILAMENTO');
    this.piezaForm.controls.relleno.enable({ emitEvent: false });
    this.piezaForm.reset({
      materialId: this.materialesPorTecnologia()[0]?.id?.toString() ?? '',
      relleno: 20,
      gramos: 10,
      horas: 1,
      minutos: 0,
      cantidad: 1,
      setup: this.configuracion()?.general.setupPorDefecto ?? 0,
      insumosExtra: 0,
      nombreArchivo: '',
    });
  }
}
