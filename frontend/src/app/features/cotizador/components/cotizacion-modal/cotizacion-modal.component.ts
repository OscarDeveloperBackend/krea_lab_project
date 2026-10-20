import { DecimalPipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { CotizacionDetail } from '../../../../core/models/cotizacion.model';

@Component({
  selector: 'app-cotizacion-modal',
  standalone: true,
  imports: [SlicePipe, DecimalPipe],
  templateUrl: './cotizacion-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CotizacionModalComponent {
  // — Signal Inputs —
  readonly cotizacion = input<CotizacionDetail | null>(null);
  readonly isOpen = input<boolean>(false);
  readonly isLoading = input<boolean>(false);

  // — Signal Outputs —
  readonly close = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
