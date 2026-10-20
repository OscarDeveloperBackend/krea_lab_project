import { Routes } from '@angular/router';
import { CotizadorPrincipal } from './features/stl/pages/cotizador-principal/cotizador-principal';
import { AdminPageComponent } from './features/cotizador/pages/admin-page/admin-page.component';

export const routes: Routes = [
  {
    path: 'stl/form-panel',
    component: CotizadorPrincipal,
    title: 'Cotizador 3D - KREA LAB',
  },
  {
    path: 'stl/admin-panel',
    component: AdminPageComponent,
    title: 'Panel de Cotizaciones - KREA LAB',
  },
  {
    path: '',
    redirectTo: 'stl/form-panel',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'stl/form-panel',
  },
];
