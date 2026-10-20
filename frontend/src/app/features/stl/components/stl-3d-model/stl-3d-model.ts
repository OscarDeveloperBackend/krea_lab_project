import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { StlModelViewerModule } from 'angular-stl-model-viewer';
import type { StlAnalisisResponse } from '../../../../core/models/cotizacion.model';

@Component({
  selector: 'stl-3d-model',
  standalone: true,
  imports: [CommonModule, StlModelViewerModule],
  templateUrl: './stl-3d-model.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stl3dModel {
  readonly stlUrl = input<string | null>(null);
  readonly stlData = input<StlAnalisisResponse | null>(null);

  readonly enabled = signal(false);

  onToggle(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.enabled.set(target.checked);
  }
}
