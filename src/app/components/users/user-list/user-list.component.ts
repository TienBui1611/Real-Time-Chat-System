import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container-fluid">
      <h2>User Management</h2>
      <p>This component will be implemented in Week 2.</p>
      <a routerLink="/dashboard" class="btn btn-secondary">Back to Dashboard</a>
    </div>
  `
})
export class UserListComponent {
}
