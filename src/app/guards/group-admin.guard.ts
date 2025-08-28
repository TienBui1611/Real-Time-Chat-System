import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

@Injectable({
  providedIn: 'root'
})
export class GroupAdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.hasAnyRole([UserRole.GROUP_ADMIN, UserRole.SUPER_ADMIN])) {
      return true;
    }
    
    // Redirect to dashboard if not group admin or super admin
    this.router.navigate(['/dashboard']);
    return false;
  }
}
