import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, shareReplay } from 'rxjs';

import {
  Categoria,
  Ingrediente,
  Receta,
  RecetaApi,
  RecetaResumen,
} from '../models/receta';

/**
 * Acceso a TheMealDB.
 *
 * Se encarga de traducir la forma de la API a los modelos de la aplicacion:
 * fuera de este archivo nadie sabe que los ingredientes vienen en 20 campos
 * numerados ni que la API devuelve null en lugar de listas vacias.
 */
@Injectable({ providedIn: 'root' })
export class Recetas {
  private readonly http = inject(HttpClient);

  private readonly base = 'https://www.themealdb.com/api/json/v1/1';

  /** Las categorias no cambian: se piden una vez y se comparten. */
  private categoriasCache?: Observable<readonly Categoria[]>;

  buscarPorNombre(termino: string): Observable<readonly RecetaResumen[]> {
    const limpio = termino.trim();

    // Sin termino la API devolveria un listado arbitrario: mejor no llamar.
    if (limpio === '') return of([]);

    return this.http
      .get<{ meals: RecetaApi[] | null }>(`${this.base}/search.php`, {
        params: { s: limpio },
      })
      .pipe(map((r) => (r.meals ?? []).map(aResumen)));
  }

  porCategoria(categoria: string): Observable<readonly RecetaResumen[]> {
    return this.http
      .get<{ meals: RecetaApi[] | null }>(`${this.base}/filter.php`, {
        params: { c: categoria },
      })
      .pipe(map((r) => (r.meals ?? []).map(aResumen)));
  }

  /**
   * El endpoint de detalle devuelve un array de un elemento, o null si el
   * identificador no existe.
   */
  porId(id: string): Observable<Receta | null> {
    return this.http
      .get<{ meals: RecetaApi[] | null }>(`${this.base}/lookup.php`, {
        params: { i: id },
      })
      .pipe(map((r) => (r.meals?.[0] ? aReceta(r.meals[0]) : null)));
  }

  aleatoria(): Observable<Receta | null> {
    return this.http
      .get<{ meals: RecetaApi[] | null }>(`${this.base}/random.php`)
      .pipe(map((r) => (r.meals?.[0] ? aReceta(r.meals[0]) : null)));
  }

  categorias(): Observable<readonly Categoria[]> {
    this.categoriasCache ??= this.http
      .get<{ categories: CategoriaApi[] }>(`${this.base}/categories.php`)
      .pipe(
        map((r) =>
          r.categories.map((c) => ({
            id: c.idCategory,
            nombre: c.strCategory,
            imagen: c.strCategoryThumb,
            descripcion: c.strCategoryDescription,
          })),
        ),
        // Sin esto cada suscripcion lanzaria una peticion nueva.
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.categoriasCache;
  }
}

interface CategoriaApi {
  readonly idCategory: string;
  readonly strCategory: string;
  readonly strCategoryThumb: string;
  readonly strCategoryDescription: string;
}

function aResumen(api: RecetaApi): RecetaResumen {
  return {
    id: api.idMeal,
    nombre: api.strMeal,
    imagen: api.strMealThumb,
    // filter.php no devuelve categoria ni origen; search.php si.
    categoria: api.strCategory ?? undefined,
    origen: api.strArea ?? undefined,
  };
}

function aReceta(api: RecetaApi): Receta {
  return {
    id: api.idMeal,
    nombre: api.strMeal,
    categoria: api.strCategory ?? 'Sin categoría',
    origen: api.strArea ?? 'Origen desconocido',
    imagen: api.strMealThumb,
    instrucciones: separarPasos(api.strInstructions),
    ingredientes: extraerIngredientes(api),
    etiquetas: (api.strTags ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e !== ''),
    video: vacioANulo(api.strYoutube),
    fuente: vacioANulo(api.strSource),
  };
}

/**
 * Los pasos llegan como un unico bloque separado por saltos de linea, con
 * numeracion inconsistente ("1.", "STEP 1", o nada). Se parte por lineas y se
 * limpia el prefijo para poder numerarlos de forma uniforme en la vista.
 */
function separarPasos(texto: string | null): readonly string[] {
  if (texto === null) return [];

  return texto
    .split(/\r?\n/)
    .map((linea) => linea.replace(/^\s*(?:STEP\s*)?\d+[.)]?\s*/i, '').trim())
    .filter((linea) => linea !== '');
}

/**
 * Recorre los 20 pares de campos y descarta los vacios. La API los rellena
 * con cadena vacia o null indistintamente segun la receta.
 */
function extraerIngredientes(api: RecetaApi): readonly Ingrediente[] {
  const ingredientes: Ingrediente[] = [];

  for (let i = 1; i <= 20; i++) {
    const nombre = (api[`strIngredient${i}`] ?? '').trim();
    if (nombre === '') continue;

    ingredientes.push({
      nombre,
      cantidad: (api[`strMeasure${i}`] ?? '').trim(),
    });
  }

  return ingredientes;
}

function vacioANulo(valor: string | null): string | null {
  const limpio = (valor ?? '').trim();
  return limpio === '' ? null : limpio;
}
