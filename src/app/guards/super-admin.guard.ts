import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isSuperAdmin()) {
      return true;
    }
    
    // Redirect to dashboard if not super admin
    this.router.navigate(['/dashboard']);
    return false;
  }
}
