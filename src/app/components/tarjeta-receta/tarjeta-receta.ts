import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RecetaResumen } from '../../models/receta';

@Component({
  selector: 'app-tarjeta-receta',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tarjeta-receta.html',
  styleUrl: './tarjeta-receta.css',
})
export class TarjetaReceta {
  readonly receta = input.required<RecetaResumen>();

  /**
   * Las primeras tarjetas se cargan de inmediato y el resto en diferido:
   * cargar 40 imagenes a la vez retrasa la primera pintura.
   */
  readonly prioritaria = input(false);
}
