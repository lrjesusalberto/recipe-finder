/**
 * Modelo de receta.
 *
 * TheMealDB devuelve los ingredientes en 20 pares de campos planos
 * (strIngredient1..20 y strMeasure1..20), muchos vacios o nulos. El servicio
 * los normaliza a una lista, asi que la aplicacion nunca ve esa forma.
 */

export interface Ingrediente {
  readonly nombre: string;
  readonly cantidad: string;
}

export interface Receta {
  readonly id: string;
  readonly nombre: string;
  readonly categoria: string;
  readonly origen: string;
  readonly imagen: string;
  readonly instrucciones: readonly string[];
  readonly ingredientes: readonly Ingrediente[];
  readonly etiquetas: readonly string[];
  readonly video: string | null;
  readonly fuente: string | null;
}

/** Version reducida para las tarjetas del listado. */
export interface RecetaResumen {
  readonly id: string;
  readonly nombre: string;
  readonly imagen: string;
  readonly categoria?: string;
  readonly origen?: string;
}

export interface Categoria {
  readonly id: string;
  readonly nombre: string;
  readonly imagen: string;
  readonly descripcion: string;
}

/** Forma cruda de la API: campos con nombre dinamico y valores nullables. */
export interface RecetaApi {
  readonly idMeal: string;
  readonly strMeal: string;
  readonly strCategory: string | null;
  readonly strArea: string | null;
  readonly strMealThumb: string;
  readonly strInstructions: string | null;
  readonly strTags: string | null;
  readonly strYoutube: string | null;
  readonly strSource: string | null;
  readonly [clave: string]: string | null;
}
