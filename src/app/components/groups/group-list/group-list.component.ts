import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container-fluid">
      <h2>Group Management</h2>
      <p>This component will be implemented in Week 3.</p>
      <a routerLink="/dashboard" class="btn btn-secondary">Back to Dashboard</a>
    </div>
  `
})
export class GroupListComponent {
}
