# Recetario

Buscador de recetas construido con **Angular 22**: búsqueda por nombre, filtrado por categoría
y ficha completa con ingredientes y preparación paso a paso. Los datos vienen de
[TheMealDB](https://www.themealdb.com).

**Demo:** https://recipes.jesuslozano.dev

## Qué hace

- **Búsqueda por nombre** con retardo, para no llamar a la API en cada tecla.
- **Filtrado por las 14 categorías** que expone la API.
- **Ficha de receta** con ingredientes y cantidades, pasos numerados y vídeo cuando existe.
- **Receta aleatoria** con el botón «Sorpréndeme».
- **Estados explícitos** de carga, error con reintento, sin resultados y receta inexistente.

## Tecnologías

| Área | Herramientas |
| --- | --- |
| Framework | Angular 22, componentes standalone |
| Estado | Signals, sin librerías externas |
| Asincronía | RxJS (`debounce`, `switchMap`) |
| Detección de cambios | Zoneless, `OnPush` |
| Lenguaje | TypeScript en modo estricto |
| Pruebas | 16 pruebas sobre el servicio con `HttpTestingController` |

## Puesta en marcha

```bash
npm install
npm start
```

La aplicación queda en `http://localhost:4200`. No hace falta clave de API.

```bash
npm run build    # Compila a dist/recipe-finder/browser
npm test         # Ejecuta las pruebas
```

## Estructura

```
src/app/
├─ models/
│  └─ receta.ts          Tipos del dominio y de la API
├─ services/
│  ├─ recetas.ts         Acceso a TheMealDB y normalización
│  └─ recetas.spec.ts    Pruebas del servicio
├─ components/
│  └─ tarjeta-receta/    Tarjeta reutilizable del listado
├─ pages/
│  ├─ inicio/            Búsqueda, categorías y rejilla
│  └─ detalle/           Ficha completa de una receta
├─ app.routes.ts         Rutas con carga diferida
└─ app.config.ts         Proveedores de la aplicación
```

## Detalles de implementación

**Normalización de la API en un solo sitio.** TheMealDB devuelve los ingredientes en veinte
pares de campos planos (`strIngredient1`…`strIngredient20`), muchos vacíos o `null`, y las
instrucciones como un bloque de texto con numeración inconsistente. El servicio los convierte
en listas antes de que salgan de él: ningún componente conoce esa forma.

**Una sola cola para búsquedas y filtros.** Ambas acciones pasan por el mismo `Subject`, de
modo que `switchMap` cancela siempre la petición anterior. Sin esto, pulsar dos categorías
seguidas podría dejar en pantalla la respuesta de la primera si llega después de la segunda.

**El retardo se aplica sólo donde tiene sentido.** Escribir en el buscador espera 350 ms; un
clic en una categoría es una acción deliberada y responde de inmediato. Se resuelve con
`debounce` y un temporizador condicional, en vez de un `debounceTime` uniforme.

**Carga diferida por ruta.** Listado y detalle van en paquetes separados, así que entrar a la
página inicial no descarga el código de la ficha.

**Imágenes con prioridad graduada.** Las ocho primeras tarjetas se cargan de inmediato y el
resto en diferido: un listado puede traer más de cien recetas, y pedirlas todas a la vez
retrasa la primera pintura. Cada hueco reserva su espacio con `aspect-ratio` para que la
rejilla no salte al ir llegando.

**Vídeo insertado sin confiar en la URL.** Del enlace de YouTube se extrae el identificador con
una expresión regular estricta y se reconstruye la URL de inserción, en lugar de interpolar
directamente lo que devuelve la API.

**Zoneless.** La aplicación no carga `zone.js`: la detección de cambios se apoya en signals y
`OnPush`, lo que reduce el paquete inicial y el trabajo en cada interacción.

## Licencia

MIT
