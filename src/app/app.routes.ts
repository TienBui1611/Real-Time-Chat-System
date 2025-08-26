import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  // Placeholder routes for future implementation
  {
    path: 'users',
    loadComponent: () => import('./components/users/user-list/user-list.component').then(m => m.UserListComponent),
    canActivate: [AuthGuard, SuperAdminGuard]
  },
  {
    path: 'groups',
    loadComponent: () => import('./components/groups/group-list/group-list.component').then(m => m.GroupListComponent),
    canActivate: [AuthGuard]
  },
  // Catch-all route - redirect to login
  { path: '**', redirectTo: '/login' }
];
