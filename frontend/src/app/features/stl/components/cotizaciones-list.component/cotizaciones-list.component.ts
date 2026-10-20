import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { CotizacionPieza } from '../../../../core/models/cotizacion.model';

@Component({
  selector: 'cotizaciones-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cotizaciones-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CotizacionesListComponent {
  // — Modern Signal Inputs —
  readonly piezas = input<CotizacionPieza[]>([]);
  readonly totalCotizacion = input<number>(0);
  readonly modoEntrega = input<string>('NOCTURNO');
  readonly puedeGuardar = input<boolean>(false);
  readonly isSaving = input<boolean>(false);

  // — Modern Signal Outputs —
  readonly guardarCotizacion = output<void>();
  readonly eliminarPieza = output<string>();

  get modoNombre(): string {
    const mapa: Record<string, string> = {
      NOCTURNO: 'Nocturno',
      DIURNO: 'Diurno',
      EXPRESS: 'Express',
    };
    return mapa[this.modoEntrega()] ?? this.modoEntrega();
  }

  onEliminar(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.eliminarPieza.emit(id);
  }
}
