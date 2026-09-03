import { bootstrapApplication } from '@angular/platform-browser';
// @vercel/analytics exporta una funcion llamada `inject`, igual que Angular.
// Se renombra para que no se confunda con el `inject` del framework, que se
// usa en los servicios y componentes.
import { inject as activarAnalitica } from '@vercel/analytics';

import { appConfig } from './app/app.config';
import { App } from './app/app';

activarAnalitica();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
