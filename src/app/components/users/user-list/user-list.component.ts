import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { FileUploadService } from '../../../services/file-upload.service';
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
  paginatedUsers: User[] = [];
  searchQuery = '';
  isLoading = false;
  error = '';
  showCreateForm = false;
  editingUser: User | null = null;
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  
  // Sorting properties
  sortBy: 'username' | 'email' | 'role' | 'createdAt' = 'username';
  sortOrder: 'asc' | 'desc' = 'asc';
  
  // Filter properties
  roleFilter: UserRole | 'all' = 'all';
  
  // For user creation/editing
  userForm = {
    username: '',
    email: '',
    password: '',
    role: UserRole.USER  // Changed to single role
  };

  // Make enum available in template
  UserRole = UserRole;
  
  // Make Math available in template
  Math = Math;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fileUploadService: FileUploadService,
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
        this.applyFilters();
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

  applyFilters(): void {
    let filtered = [...this.users];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (this.roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === this.roleFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'username':
          comparison = a.username.localeCompare(b.username);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredUsers = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    
    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  onSearch(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.applyFilters();
  }

  onRoleFilterChange(): void {
    this.currentPage = 1; // Reset to first page when filtering
    this.applyFilters();
  }

  onSort(column: 'username' | 'email' | 'role' | 'createdAt'): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) return 'bi-arrow-down-up';
    return this.sortOrder === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  changeItemsPerPage(newSize: number): void {
    this.itemsPerPage = newSize;
    this.currentPage = 1;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const halfRange = Math.floor(maxPagesToShow / 2);
    
    let startPage = Math.max(1, this.currentPage - halfRange);
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
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

  /**
   * Get avatar URL for display
   */
  getAvatarUrl(avatarPath: string): string {
    return this.fileUploadService.getAvatarUrl(avatarPath);
  }

  // Helper method for quick role promotion
  quickPromoteUser(user: User, newRole: UserRole): void {
    if (confirm(`Are you sure you want to change ${user.username}'s role to ${this.getRoleDisplay(newRole)}?`)) {
      this.promoteUser(user, newRole);
    }
  }
}
