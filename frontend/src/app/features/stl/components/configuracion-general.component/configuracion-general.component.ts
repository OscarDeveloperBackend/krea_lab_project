import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import type {
  ConfiguracionInicialResponse,
  GeneralConfig,
  MaquinaConfig,
  Tecnologia,
} from '../../../../core/models/configuracion.model';

@Component({
  selector: 'configuracion-general',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './configuracion-general.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionGeneralComponent {
  // — Modern Signal Inputs —
  readonly configuracion = input<ConfiguracionInicialResponse | null>(null);
  readonly modoSeleccionado = input<string>('NOCTURNO');

  // — Modern Signal Outputs —
  readonly modoChange = output<string>();
  readonly configuracionChange = output<ConfiguracionInicialResponse>();

  readonly isOpen = signal(false);
  readonly tecnologias: Tecnologia[] = ['FILAMENTO', 'RESINA'];

  readonly generalFields: Array<{ key: keyof GeneralConfig; label: string; step: string }> = [
    { key: 'precioKwh', label: 'Precio por kWh', step: '0.01' },
    { key: 'tarifaManoObraPorHora', label: 'Mano de obra por hora', step: '0.01' },
    { key: 'setupPorDefecto', label: 'Setup por defecto', step: '0.01' },
    { key: 'minutosManoObraPorDefecto', label: 'Minutos por defecto', step: '1' },
    { key: 'multiplicadorPrecioBase', label: 'Multiplicador base', step: '0.01' },
    { key: 'porcentajeRangoInferior', label: 'Porcentaje mínimo', step: '0.01' },
    { key: 'porcentajeRangoSuperior', label: 'Porcentaje máximo', step: '0.01' },
    { key: 'diasVencimiento', label: 'Vigencia de cotización (días)', step: '1' },
  ];

  readonly machineFields: Array<{ key: keyof MaquinaConfig; label: string; step: string }> = [
    { key: 'consumoWatts', label: 'Consumo (W)', step: '1' },
    { key: 'vidaUtilHoras', label: 'Vida útil (h)', step: '1' },
    { key: 'costoMaquina', label: 'Costo de máquina', step: '0.01' },
    { key: 'porcentajeMerma', label: 'Merma (%)', step: '0.01' },
    { key: 'porcentajeFallos', label: 'Fallos (%)', step: '0.01' },
    { key: 'costoPostProceso', label: 'Postproceso', step: '0.01' },
  ];

  get modosDisponibles() {
    return this.configuracion()?.modos ?? [];
  }

  onModoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.modoChange.emit(target.value);
  }

  updateGeneral(field: keyof GeneralConfig, event: Event): void {
    const cfg = this.configuracion();
    const value = Number((event.target as HTMLInputElement).value);
    if (!cfg || !Number.isFinite(value)) return;
    this.configuracionChange.emit({
      ...cfg,
      general: { ...cfg.general, [field]: value },
    });
  }

  updateMachine(technology: Tecnologia, field: keyof MaquinaConfig, event: Event): void {
    const cfg = this.configuracion();
    const value = Number((event.target as HTMLInputElement).value);
    const machine = cfg?.maquinas[technology];
    if (!cfg || !machine || !Number.isFinite(value)) return;
    this.configuracionChange.emit({
      ...cfg,
      maquinas: {
        ...cfg.maquinas,
        [technology]: { ...machine, [field]: value },
      },
    });
  }
}
