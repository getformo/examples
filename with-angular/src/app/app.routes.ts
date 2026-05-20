import { Routes } from '@angular/router';

import { About } from './pages/about';
import { Home } from './pages/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'Formo × Angular' },
  { path: 'about', component: About, title: 'About · Formo × Angular' },
  { path: '**', redirectTo: '' },
];
