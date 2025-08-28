import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { User, UserRole } from '../../../models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchQuery = '';
  isLoading = false;
  error = '';
  showCreateForm = false;
  editingUser: User | null = null;
  
  // For user creation/editing
  userForm = {
    username: '',
    email: '',
    password: '',
    role: UserRole.USER  // Changed to single role
  };

  // Make enum available in template
  UserRole = UserRole;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.error = '';
    
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        this.users = response.users;
        this.filteredUsers = [...this.users];
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load users';
        this.isLoading = false;
        
        if (error.status === 403) {
          this.router.navigate(['/dashboard']);
        }
      }
    });
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredUsers = [...this.users];
  }

  showCreateUserForm(): void {
    this.showCreateForm = true;
    this.editingUser = null;
    this.resetForm();
  }

  showEditUserForm(user: User): void {
    this.editingUser = user;
    this.showCreateForm = true;
    this.userForm = {
      username: user.username,
      email: user.email,
      password: '',
      role: user.role  // Changed to single role
    };
  }

  hideForm(): void {
    this.showCreateForm = false;
    this.editingUser = null;
    this.resetForm();
  }

  resetForm(): void {
    this.userForm = {
      username: '',
      email: '',
      password: '',
      role: UserRole.USER  // Changed to single role
    };
  }

  onSubmitUser(): void {
    if (this.editingUser) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  createUser(): void {
    this.isLoading = true;
    
    this.userService.createUser(this.userForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadUsers();
          this.hideForm();
        } else {
          this.error = response.message || 'Failed to create user';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to create user';
        this.isLoading = false;
      }
    });
  }

  updateUser(): void {
    if (!this.editingUser) return;
    
    this.isLoading = true;
    const updateData = {
      username: this.userForm.username,
      email: this.userForm.email,
      role: this.userForm.role  // Changed to single role
    };
    
    this.userService.updateUser(this.editingUser.id, updateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadUsers();
          this.hideForm();
        } else {
          this.error = response.message || 'Failed to update user';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update user';
        this.isLoading = false;
      }
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      return;
    }

    this.isLoading = true;
    
    this.userService.deleteUser(user.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadUsers();
        } else {
          this.error = response.message || 'Failed to delete user';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to delete user';
        this.isLoading = false;
      }
    });
  }

  promoteUser(user: User, newRole: UserRole): void {
    this.isLoading = true;
    
    this.userService.promoteUser(user.id, newRole).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadUsers();
        } else {
          this.error = response.message || 'Failed to update user role';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update user role';
        this.isLoading = false;
      }
    });
  }

  selectRole(role: UserRole): void {
    this.userForm.role = role;
  }

  isRoleSelected(role: UserRole): boolean {
    return this.userForm.role === role;
  }

  getCurrentUserId(): string | null {
    return this.authService.getCurrentUser()?.id || null;
  }

  canDeleteUser(user: User): boolean {
    const currentUserId = this.getCurrentUserId();
    // Prevent users from deleting themselves
    return user.id !== currentUserId;
  }

  getRoleDisplay(role: UserRole): string {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Admin';
      case UserRole.GROUP_ADMIN:
        return 'Group Admin';
      case UserRole.USER:
        return 'User';
      default:
        return role;
    }
  }

  getRoleBadgeClass(role: UserRole): string {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-danger';
      case UserRole.GROUP_ADMIN:
        return 'bg-warning';
      case UserRole.USER:
        return 'bg-primary';
      default:
        return 'bg-secondary';
    }
  }

  // Helper method for quick role promotion
  quickPromoteUser(user: User, newRole: UserRole): void {
    if (confirm(`Are you sure you want to change ${user.username}'s role to ${this.getRoleDisplay(newRole)}?`)) {
      this.promoteUser(user, newRole);
    }
  }
}
