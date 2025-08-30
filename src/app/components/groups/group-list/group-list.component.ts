import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroupService } from '../../../services/group.service';
import { AuthService } from '../../../services/auth.service';
import { Group, CreateGroupRequest, UserRole } from '../../../models';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css']
})
export class GroupListComponent implements OnInit {
  groups: Group[] = [];
  filteredGroups: Group[] = [];
  searchQuery = '';
  isLoading = false;
  error = '';
  showCreateForm = false;
  editingGroup: Group | null = null;
  
  // For group creation/editing
  groupForm: CreateGroupRequest = {
    name: '',
    description: ''
  };

  // Make enum available in template
  UserRole = UserRole;

  constructor(
    private groupService: GroupService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.isLoading = true;
    this.error = '';
    
    this.groupService.getAllGroups().subscribe({
      next: (response) => {
        this.groups = response.groups;
        this.filteredGroups = [...this.groups];
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load groups';
        this.isLoading = false;
        
        if (error.status === 403) {
          this.router.navigate(['/dashboard']);
        }
      }
    });
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredGroups = [...this.groups];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredGroups = this.groups.filter(group =>
      group.name.toLowerCase().includes(query) ||
      group.description.toLowerCase().includes(query)
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredGroups = [...this.groups];
  }

  showCreateGroupForm(): void {
    this.showCreateForm = true;
    this.editingGroup = null;
    this.resetForm();
  }

  showEditGroupForm(group: Group): void {
    this.editingGroup = group;
    this.showCreateForm = true;
    this.groupForm = {
      name: group.name,
      description: group.description
    };
  }

  hideForm(): void {
    this.showCreateForm = false;
    this.editingGroup = null;
    this.resetForm();
  }

  resetForm(): void {
    this.groupForm = {
      name: '',
      description: ''
    };
  }

  onSubmitGroup(): void {
    if (this.editingGroup) {
      this.updateGroup();
    } else {
      this.createGroup();
    }
  }

  createGroup(): void {
    this.isLoading = true;
    
    this.groupService.createGroup(this.groupForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadGroups();
          this.hideForm();
        } else {
          this.error = response.message || 'Failed to create group';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to create group';
        this.isLoading = false;
      }
    });
  }

  updateGroup(): void {
    if (!this.editingGroup) return;
    
    this.isLoading = true;
    
    this.groupService.updateGroup(this.editingGroup.id, this.groupForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadGroups();
          this.hideForm();
        } else {
          this.error = response.message || 'Failed to update group';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update group';
        this.isLoading = false;
      }
    });
  }

  deleteGroup(group: Group): void {
    if (!confirm(`Are you sure you want to delete group "${group.name}"? This action cannot be undone and will also delete all channels in this group.`)) {
      return;
    }

    this.isLoading = true;
    
    this.groupService.deleteGroup(group.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadGroups();
        } else {
          this.error = response.message || 'Failed to delete group';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to delete group';
        this.isLoading = false;
      }
    });
  }

  joinGroup(group: Group): void {
    this.isLoading = true;
    
    this.groupService.joinGroup(group.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadGroups();
        } else {
          this.error = response.message || 'Failed to join group';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to join group';
        this.isLoading = false;
      }
    });
  }

  leaveGroup(group: Group): void {
    if (!confirm(`Are you sure you want to leave group "${group.name}"?`)) {
      return;
    }

    this.isLoading = true;
    
    this.groupService.leaveGroup(group.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadGroups();
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

  canManageGroup(group: Group): boolean {
    return this.groupService.canManageGroup(group);
  }

  isGroupMember(group: Group): boolean {
    return this.groupService.isGroupMember(group);
  }

  canCreateGroups(): boolean {
    return this.authService.isGroupAdmin() || this.authService.isSuperAdmin();
  }

  getCurrentUserId(): string | null {
    return this.authService.getCurrentUser()?.id || null;
  }

  navigateToChannels(groupId: string): void {
    this.router.navigate(['/channels', groupId]);
  }

  getMemberCount(group: Group): number {
    // Count unique members (members + admins)
    // Note: creator is already included in admins array
    const allMembers = new Set([
      ...group.members,
      ...group.admins
    ]);
    return allMembers.size;
  }

  getChannelCount(group: Group): number {
    return group.channels.length;
  }

  isCreator(group: Group): boolean {
    const currentUserId = this.getCurrentUserId();
    return currentUserId === group.createdBy;
  }

  isAdmin(group: Group): boolean {
    const currentUserId = this.getCurrentUserId();
    return currentUserId ? group.admins.includes(currentUserId) : false;
  }

  getGroupRole(group: Group): string {
    if (this.isCreator(group)) return 'Creator';
    if (this.isAdmin(group)) return 'Admin';
    if (this.isGroupMember(group)) return 'Member';
    return 'Not a member';
  }

  getGroupRoleBadgeClass(group: Group): string {
    if (this.isCreator(group)) return 'bg-danger';
    if (this.isAdmin(group)) return 'bg-warning';
    if (this.isGroupMember(group)) return 'bg-primary';
    return 'bg-secondary';
  }
}
