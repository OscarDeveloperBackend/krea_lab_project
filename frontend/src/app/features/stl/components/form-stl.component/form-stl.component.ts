import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import type {
  ConfiguracionInicialResponse,
  MaterialConfig,
  Tecnologia,
} from '../../../../core/models/configuracion.model';
import type { StlAnalisisResponse } from '../../../../core/models/cotizacion.model';

@Component({
  selector: 'form-stl',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-stl.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormStlComponent {
  // — Modern Signal Inputs —
  readonly configuracion = input<ConfiguracionInicialResponse | null>(null);
  readonly materiales = input<MaterialConfig[]>([]);
  readonly selectedTechnology = input<Tecnologia>('FILAMENTO');
  readonly selectedMode = input<string>('NOCTURNO');
  readonly stlData = input<StlAnalisisResponse | null>(null);
  readonly gramosCalculados = input<number | null>(null);
  readonly form = input.required<FormGroup>();

  // — Modern Signal Outputs —
  readonly tecnologiaChange = output<Tecnologia>();
  readonly agregarPieza = output<void>();

  get isAddDisabled(): boolean {
    return !this.stlData() || this.form().invalid;
  }

  onTecnologiaChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.tecnologiaChange.emit(target.value as Tecnologia);
  }

  hasError(name: string): boolean {
    const ctrl = this.form().get(name);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
