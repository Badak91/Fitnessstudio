import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Members } from './pages/members/members';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'members',
    component: Members,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];