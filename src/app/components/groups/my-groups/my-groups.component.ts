import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroupService } from '../../../services/group.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { Group, UserRole, User } from '../../../models';

@Component({
  selector: 'app-my-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './my-groups.component.html',
  styleUrls: ['./my-groups.component.css']
})
export class MyGroupsComponent implements OnInit {
  groups: Group[] = [];
  filteredGroups: Group[] = [];
  searchQuery = '';
  isLoading = false;
  error = '';
  
  // User lookup cache
  userCache: Map<string, User> = new Map();

  // Make enum available in template
  UserRole = UserRole;

  constructor(
    private groupService: GroupService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyGroups();
    this.loadUsers().catch(error => {
      console.error('Failed to load users on init:', error);
    });
  }

  loadMyGroups(): void {
    this.isLoading = true;
    this.error = '';
    
    this.groupService.getUserGroups().subscribe({
      next: (response) => {
        this.groups = response.groups || [];
        this.applySearchFilter();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load groups';
        this.isLoading = false;
      }
    });
  }

  applySearchFilter(): void {
    if (!this.searchQuery.trim()) {
      this.filteredGroups = [...this.groups];
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredGroups = this.groups.filter(group => 
        group.name.toLowerCase().includes(query) || 
        group.description.toLowerCase().includes(query)
      );
    }
  }

  onSearchChange(): void {
    this.applySearchFilter();
  }

  navigateToChannels(groupId: string): void {
    this.router.navigate(['/channels', groupId]);
  }

  leaveGroup(group: Group): void {
    if (!confirm(`Are you sure you want to leave "${group.name}"?`)) {
      return;
    }

    this.isLoading = true;
    this.groupService.leaveGroup(group.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMyGroups(); // Refresh the list
        } else {
          this.error = response.message || 'Failed to leave group';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to leave group';
        this.isLoading = false;
      }
    });
  }

  // Helper methods
  isCreator(group: Group): boolean {
    const currentUserId = this.getCurrentUserId();
    return currentUserId ? group.createdBy === currentUserId : false;
  }

  isAdmin(group: Group): boolean {
    const currentUserId = this.getCurrentUserId();
    return currentUserId ? group.admins.includes(currentUserId) : false;
  }

  isGroupMember(group: Group): boolean {
    const currentUserId = this.getCurrentUserId();
    return currentUserId ? 
      (group.members.includes(currentUserId) || 
       group.admins.includes(currentUserId) || 
       group.createdBy === currentUserId) : 
      false;
  }

  getCurrentUserId(): string | null {
    return this.authService.getCurrentUser()?.id || null;
  }

  getMemberCount(group: Group): number {
    // Count unique members (members + admins)
    const allMembers = new Set([
      ...group.members,
      ...group.admins,
      group.createdBy
    ]);
    return allMembers.size;
  }

  getChannelCount(group: Group): number {
    return group.channels ? group.channels.length : 0;
  }

  getMyRole(group: Group): string {
    if (this.isCreator(group)) return 'Creator';
    if (this.isAdmin(group)) return 'Admin';
    return 'Member';
  }

  getMyRoleBadgeClass(group: Group): string {
    if (this.isCreator(group)) return 'bg-danger';
    if (this.isAdmin(group)) return 'bg-warning';
    return 'bg-primary';
  }

  loadUsers(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userService.getAllUsers().subscribe({
        next: (response) => {
          // Cache users for quick lookup
          response.users.forEach(user => {
            this.userCache.set(user.id, user);
          });
          resolve();
        },
        error: (error) => {
          console.error('Failed to load users:', error);
          reject(error);
        }
      });
    });
  }

  getUsernameById(userId: string): string {
    const user = this.userCache.get(userId);
    return user ? user.username : userId; // Fallback to ID if user not found
  }

  getCreatorName(group: Group): string {
    return this.getUsernameById(group.createdBy);
  }
}
