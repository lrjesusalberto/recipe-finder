import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, debounce, of, switchMap, timer } from 'rxjs';

import { TarjetaReceta } from '../../components/tarjeta-receta/tarjeta-receta';
import { RecetaResumen } from '../../models/receta';
import { Recetas } from '../../services/recetas';

/** Cuantas tarjetas se cargan con prioridad alta: las visibles al entrar. */
const TARJETAS_PRIORITARIAS = 8;

/** Categoria que se muestra al entrar, en lugar de una pagina vacia. */
const CATEGORIA_INICIAL = 'Seafood';

/** Espera antes de buscar, para no llamar a la API en cada tecla. */
const RETARDO_BUSQUEDA = 350;

/** Que origen alimenta el listado en cada momento. */
type Peticion =
  | { readonly tipo: 'busqueda'; readonly termino: string }
  | { readonly tipo: 'categoria'; readonly categoria: string };

@Component({
  selector: 'app-inicio',
  imports: [TarjetaReceta],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  private readonly recetas = inject(Recetas);
  private readonly router = inject(Router);

  readonly categorias = toSignal(this.recetas.categorias(), { initialValue: [] });

  readonly resultados = signal<readonly RecetaResumen[]>([]);
  readonly cargando = signal(false);
  readonly error = signal(false);

  /** Que se esta mostrando, para el encabezado del listado. */
  readonly consulta = signal('');
  readonly categoriaActiva = signal<string | null>(null);

  readonly termino = signal('');

  readonly prioritarias = TARJETAS_PRIORITARIAS;

  /**
   * Busquedas y filtros comparten una sola cola, de modo que switchMap
   * cancela la peticion anterior sea cual sea su origen: sin esto, pulsar
   * dos categorias seguidas podria dejar en pantalla la respuesta de la
   * primera si llega despues de la segunda.
   */
  private readonly peticiones = new Subject<Peticion>();

  constructor() {
    this.peticiones
      .pipe(
        // Solo las busquedas esperan a que el usuario deje de escribir; un
        // clic en una categoria es una accion deliberada y responde ya.
        debounce((peticion) =>
          peticion.tipo === 'busqueda' ? timer(RETARDO_BUSQUEDA) : of(0),
        ),
        switchMap((peticion) =>
          peticion.tipo === 'busqueda'
            ? this.recetas.buscarPorNombre(peticion.termino)
            : this.recetas.porCategoria(peticion.categoria),
        ),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (recetas) => {
          this.resultados.set(recetas);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(true);
          this.cargando.set(false);
        },
      });

    this.filtrarPor(CATEGORIA_INICIAL);
  }

  buscar(valor: string): void {
    this.termino.set(valor);
    this.categoriaActiva.set(null);
    this.consulta.set(valor.trim());

    if (valor.trim() === '') {
      this.resultados.set([]);
      this.cargando.set(false);
      this.error.set(false);
      return;
    }

    this.cargando.set(true);
    this.error.set(false);
    this.peticiones.next({ tipo: 'busqueda', termino: valor });
  }

  filtrarPor(categoria: string): void {
    this.termino.set('');
    this.consulta.set('');
    this.categoriaActiva.set(categoria);
    this.cargando.set(true);
    this.error.set(false);

    this.peticiones.next({ tipo: 'categoria', categoria });
  }

  sorprender(): void {
    this.cargando.set(true);
    this.error.set(false);

    this.recetas.aleatoria().subscribe({
      next: (receta) => {
        this.cargando.set(false);
        if (receta) void this.router.navigate(['/receta', receta.id]);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  reintentar(): void {
    const categoria = this.categoriaActiva();

    if (categoria !== null) {
      this.filtrarPor(categoria);
      return;
    }

    this.buscar(this.termino());
  }
}
