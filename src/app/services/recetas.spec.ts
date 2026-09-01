import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { Recetas } from './recetas';
import { RecetaApi } from '../models/receta';

const BASE = 'https://www.themealdb.com/api/json/v1/1';

/** Receta de ejemplo con la forma exacta que devuelve la API. */
function recetaApi(extra: Partial<RecetaApi> = {}): RecetaApi {
  return {
    idMeal: '52771',
    strMeal: 'Spicy Arrabiata Penne',
    strCategory: 'Vegetarian',
    strArea: 'Italian',
    strMealThumb: 'https://ejemplo.test/arrabiata.jpg',
    strInstructions: 'Bring a large pot of water to a boil.\r\nAdd the pasta.',
    strTags: 'Pasta,Curry',
    strYoutube: 'https://www.youtube.com/watch?v=1IszT_guI08',
    strSource: null,
    strIngredient1: 'penne rigate',
    strMeasure1: '1 pound',
    strIngredient2: 'olive oil',
    strMeasure2: '1/4 cup',
    strIngredient3: '',
    strMeasure3: '',
    strIngredient4: null,
    strMeasure4: null,
    ...extra,
  } as RecetaApi;
}

describe('Recetas', () => {
  let servicio: Recetas;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(Recetas);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('buscarPorNombre', () => {
    it('convierte la respuesta a resúmenes', () => {
      let resultado: readonly unknown[] = [];
      servicio.buscarPorNombre('arrabiata').subscribe((r) => (resultado = r));

      const peticion = http.expectOne(`${BASE}/search.php?s=arrabiata`);
      expect(peticion.request.method).toBe('GET');
      peticion.flush({ meals: [recetaApi()] });

      expect(resultado).toEqual([
        {
          id: '52771',
          nombre: 'Spicy Arrabiata Penne',
          imagen: 'https://ejemplo.test/arrabiata.jpg',
          categoria: 'Vegetarian',
          origen: 'Italian',
        },
      ]);
    });

    it('devuelve lista vacía cuando la API responde null', () => {
      let resultado: readonly unknown[] = ['sin tocar'];
      servicio.buscarPorNombre('zzzz').subscribe((r) => (resultado = r));

      http.expectOne(`${BASE}/search.php?s=zzzz`).flush({ meals: null });

      expect(resultado).toEqual([]);
    });

    it('no llama a la API con el término vacío', () => {
      let resultado: readonly unknown[] = ['sin tocar'];
      servicio.buscarPorNombre('   ').subscribe((r) => (resultado = r));

      http.expectNone(() => true);
      expect(resultado).toEqual([]);
    });

    it('recorta los espacios del término', () => {
      servicio.buscarPorNombre('  pasta  ').subscribe();
      http.expectOne(`${BASE}/search.php?s=pasta`).flush({ meals: null });
    });
  });

  describe('porId', () => {
    it('normaliza los ingredientes descartando los vacíos', () => {
      let receta: { ingredientes: readonly unknown[] } | null = null;
      servicio.porId('52771').subscribe((r) => (receta = r as never));

      http.expectOne(`${BASE}/lookup.php?i=52771`).flush({ meals: [recetaApi()] });

      // Los campos 3 (cadena vacía) y 4 (null) no deben aparecer.
      expect(receta!.ingredientes).toEqual([
        { nombre: 'penne rigate', cantidad: '1 pound' },
        { nombre: 'olive oil', cantidad: '1/4 cup' },
      ]);
    });

    it('separa las instrucciones en pasos', () => {
      let receta: { instrucciones: readonly string[] } | null = null;
      servicio.porId('52771').subscribe((r) => (receta = r as never));

      http.expectOne(`${BASE}/lookup.php?i=52771`).flush({ meals: [recetaApi()] });

      expect(receta!.instrucciones).toEqual([
        'Bring a large pot of water to a boil.',
        'Add the pasta.',
      ]);
    });

    it('quita la numeración previa de los pasos', () => {
      let receta: { instrucciones: readonly string[] } | null = null;
      servicio.porId('1').subscribe((r) => (receta = r as never));

      http.expectOne(`${BASE}/lookup.php?i=1`).flush({
        meals: [recetaApi({ strInstructions: '1. Picar.\r\nSTEP 2 Sofreír.\r\n3) Servir.' })],
      });

      expect(receta!.instrucciones).toEqual(['Picar.', 'Sofreír.', 'Servir.']);
    });

    it('descarta las líneas en blanco de los pasos', () => {
      let receta: { instrucciones: readonly string[] } | null = null;
      servicio.porId('1').subscribe((r) => (receta = r as never));

      http.expectOne(`${BASE}/lookup.php?i=1`).flush({
        meals: [recetaApi({ strInstructions: 'Uno.\r\n\r\n   \r\nDos.' })],
      });

      expect(receta!.instrucciones).toEqual(['Uno.', 'Dos.']);
    });

    it('separa las etiquetas', () => {
      let receta: { etiquetas: readonly string[] } | null = null;
      servicio.porId('52771').subscribe((r) => (receta = r as never));

      http.expectOne(`${BASE}/lookup.php?i=52771`).flush({ meals: [recetaApi()] });

      expect(receta!.etiquetas).toEqual(['Pasta', 'Curry']);
    });

    it('devuelve lista vacía de etiquetas cuando no hay', () => {
      let receta: { etiquetas: readonly string[] } | null = null;
      servicio.porId('1').subscribe((r) => (receta = r as never));

      http.expectOne(`${BASE}/lookup.php?i=1`).flush({
        meals: [recetaApi({ strTags: null })],
      });

      expect(receta!.etiquetas).toEqual([]);
    });

    it('convierte las cadenas vacías en null', () => {
      let receta: { fuente: string | null; video: string | null } | null = null;
      servicio.porId('1').subscribe((r) => (receta = r as never));

      http.expectOne(`${BASE}/lookup.php?i=1`).flush({
        meals: [recetaApi({ strSource: '   ', strYoutube: '' })],
      });

      expect(receta!.fuente).toBeNull();
      expect(receta!.video).toBeNull();
    });

    it('usa valores por defecto cuando faltan categoría y origen', () => {
      let receta: { categoria: string; origen: string } | null = null;
      servicio.porId('1').subscribe((r) => (receta = r as never));

      http.expectOne(`${BASE}/lookup.php?i=1`).flush({
        meals: [recetaApi({ strCategory: null, strArea: null })],
      });

      expect(receta!.categoria).toBe('Sin categoría');
      expect(receta!.origen).toBe('Origen desconocido');
    });

    it('devuelve null si la receta no existe', () => {
      let receta: unknown = 'sin tocar';
      servicio.porId('999999').subscribe((r) => (receta = r));

      http.expectOne(`${BASE}/lookup.php?i=999999`).flush({ meals: null });

      expect(receta).toBeNull();
    });
  });

  describe('porCategoria', () => {
    it('pide el filtro por categoría', () => {
      let resultado: readonly { categoria?: string }[] = [];
      servicio.porCategoria('Seafood').subscribe((r) => (resultado = r));

      // filter.php no devuelve categoría ni origen.
      http.expectOne(`${BASE}/filter.php?c=Seafood`).flush({
        meals: [
          {
            idMeal: '52959',
            strMeal: 'Baked salmon',
            strMealThumb: 'https://ejemplo.test/salmon.jpg',
          },
        ],
      });

      expect(resultado.length).toBe(1);
      expect(resultado[0].categoria).toBeUndefined();
    });
  });

  describe('categorias', () => {
    it('mapea las categorías', () => {
      let resultado: readonly unknown[] = [];
      servicio.categorias().subscribe((r) => (resultado = r));

      http.expectOne(`${BASE}/categories.php`).flush({
        categories: [
          {
            idCategory: '1',
            strCategory: 'Beef',
            strCategoryThumb: 'https://ejemplo.test/beef.png',
            strCategoryDescription: 'Carne de vacuno.',
          },
        ],
      });

      expect(resultado).toEqual([
        {
          id: '1',
          nombre: 'Beef',
          imagen: 'https://ejemplo.test/beef.png',
          descripcion: 'Carne de vacuno.',
        },
      ]);
    });

    it('sólo pide las categorías una vez', () => {
      servicio.categorias().subscribe();
      http.expectOne(`${BASE}/categories.php`).flush({ categories: [] });

      // La segunda suscripción debe servirse de la caché.
      servicio.categorias().subscribe();
      http.expectNone(`${BASE}/categories.php`);
    });
  });
});
