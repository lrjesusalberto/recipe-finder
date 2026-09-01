import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { Receta } from '../../models/receta';
import { Recetas } from '../../services/recetas';

@Component({
  selector: 'app-detalle',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detalle.html',
  styleUrl: './detalle.css',
})
export class Detalle {
  private readonly recetas = inject(Recetas);
  private readonly location = inject(Location);
  private readonly sanitizer = inject(DomSanitizer);

  /** Llega de la ruta gracias a withComponentInputBinding(). */
  readonly id = input.required<string>();

  readonly receta = signal<Receta | null>(null);
  readonly cargando = signal(true);
  readonly error = signal(false);
  /** Distingue "fallo de red" de "esta receta no existe". */
  readonly noEncontrada = signal(false);

  constructor() {
    // Un effect sobre el id cubre tanto la primera carga como la navegacion
    // entre recetas, donde Angular reutiliza el componente y solo cambia la
    // entrada. Con ngOnInit haria falta ademas suscribirse a los parametros.
    effect(() => {
      const id = this.id();
      if (id) this.cargar(id);
    });
  }

  private cargar(id: string): void {
    this.cargando.set(true);
    this.error.set(false);
    this.noEncontrada.set(false);
    this.receta.set(null);

    this.recetas.porId(id).subscribe({
      next: (receta) => {
        if (receta === null) {
          this.noEncontrada.set(true);
        } else {
          this.receta.set(receta);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  volver(): void {
    this.location.back();
  }

  reintentar(): void {
    this.cargar(this.id());
  }

  /**
   * Convierte la URL de YouTube en la de insercion. Se extrae el
   * identificador con una expresion regular estricta en lugar de interpolar
   * la URL recibida: asi la API no puede inyectar un src arbitrario.
   */
  urlVideo(url: string): SafeResourceUrl | null {
    const id = url.match(/[?&]v=([\w-]{11})/)?.[1];
    if (!id) return null;

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${id}`,
    );
  }
}
