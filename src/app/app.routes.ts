import { Routes } from '@angular/router';

/**
 * Las paginas se cargan en diferido: quien entra al listado no descarga el
 * codigo del detalle hasta que lo necesita.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
    title: 'Recetario — Encuentra tu próxima receta',
  },
  {
    path: 'receta/:id',
    loadComponent: () => import('./pages/detalle/detalle').then((m) => m.Detalle),
    title: 'Receta — Recetario',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
