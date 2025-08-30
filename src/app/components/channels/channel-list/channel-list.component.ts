import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChannelService } from '../../../services/channel.service';
import { GroupService } from '../../../services/group.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { Channel, CreateChannelRequest, Group, UserRole, User } from '../../../models';

@Component({
  selector: 'app-channel-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.css']
})
export class ChannelListComponent implements OnInit {
  channels: Channel[] = [];
  filteredChannels: Channel[] = [];
  currentGroup: Group | null = null;
  groupId: string = '';
  searchQuery = '';
  isLoading = false;
  error = '';
  showCreateForm = false;
  editingChannel: Channel | null = null;
  
  // Member management
  showMemberManagement = false;
  managingChannel: Channel | null = null;
  channelMembers: any[] = [];
  availableChannelUsers: User[] = [];
  selectedUserId = '';
  
  // User lookup cache
  userCache: Map<string, User> = new Map();
  
  // For channel creation/editing
  channelForm: CreateChannelRequest = {
    name: '',
    description: '',
    groupId: ''
  };

  // Make enum available in template
  UserRole = UserRole;

  constructor(
    private channelService: ChannelService,
    private groupService: GroupService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.groupId = params['groupId'];
      if (this.groupId) {
        this.channelForm.groupId = this.groupId;
        this.loadUsers();
        this.loadGroup();
        this.loadChannels();
      } else {
        this.router.navigate(['/groups']);
      }
    });
  }

  loadGroup(): void {
    this.groupService.getGroupById(this.groupId).subscribe({
      next: (response) => {
        this.currentGroup = response.group;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load group';
        if (error.status === 403 || error.status === 404) {
          this.router.navigate(['/groups']);
        }
      }
    });
  }

  loadChannels(): void {
    this.isLoading = true;
    this.error = '';
    
    this.channelService.getChannelsByGroup(this.groupId).subscribe({
      next: (response) => {
        this.channels = response.channels;
        this.filteredChannels = [...this.channels];
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load channels';
        this.isLoading = false;
        
        if (error.status === 403) {
          this.router.navigate(['/groups']);
        }
      }
    });
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredChannels = [...this.channels];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredChannels = this.channels.filter(channel =>
      channel.name.toLowerCase().includes(query) ||
      channel.description.toLowerCase().includes(query)
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredChannels = [...this.channels];
  }

  showCreateChannelForm(): void {
    this.showCreateForm = true;
    this.editingChannel = null;
    this.resetForm();
  }

  showEditChannelForm(channel: Channel): void {
    this.editingChannel = channel;
    this.showCreateForm = true;
    this.channelForm = {
      name: channel.name,
      description: channel.description,
      groupId: channel.groupId
    };
  }

  hideForm(): void {
    this.showCreateForm = false;
    this.editingChannel = null;
    this.resetForm();
  }

  showManageMembersForm(channel: Channel): void {
    this.managingChannel = channel;
    this.showMemberManagement = true;
    this.selectedUserId = '';
    this.loadChannelMembers();
    this.loadAvailableChannelUsers();
  }

  hideMemberManagement(): void {
    this.showMemberManagement = false;
    this.managingChannel = null;
    this.channelMembers = [];
    this.availableChannelUsers = [];
    this.selectedUserId = '';
  }

  resetForm(): void {
    this.channelForm = {
      name: '',
      description: '',
      groupId: this.groupId
    };
  }

  onSubmitChannel(): void {
    if (this.editingChannel) {
      this.updateChannel();
    } else {
      this.createChannel();
    }
  }

  createChannel(): void {
    this.isLoading = true;
    
    this.channelService.createChannel(this.channelForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadChannels();
          this.hideForm();
        } else {
          this.error = response.message || 'Failed to create channel';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to create channel';
        this.isLoading = false;
      }
    });
  }

  updateChannel(): void {
    if (!this.editingChannel) return;
    
    this.isLoading = true;
    
    const updateData = {
      name: this.channelForm.name,
      description: this.channelForm.description
    };
    
    this.channelService.updateChannel(this.editingChannel.id, updateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadChannels();
          this.hideForm();
        } else {
          this.error = response.message || 'Failed to update channel';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update channel';
        this.isLoading = false;
      }
    });
  }

  deleteChannel(channel: Channel): void {
    if (!confirm(`Are you sure you want to delete channel "${channel.name}"? This action cannot be undone.`)) {
      return;
    }

    this.isLoading = true;
    
    this.channelService.deleteChannel(channel.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadChannels();
        } else {
          this.error = response.message || 'Failed to delete channel';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to delete channel';
        this.isLoading = false;
      }
    });
  }

  joinChannel(channel: Channel): void {
    this.isLoading = true;
    
    this.channelService.joinChannel(channel.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadChannels();
        } else {
          this.error = response.message || 'Failed to join channel';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to join channel';
        this.isLoading = false;
      }
    });
  }

  leaveChannel(channel: Channel): void {
    if (!confirm(`Are you sure you want to leave channel "${channel.name}"?`)) {
      return;
    }

    this.isLoading = true;
    
    this.channelService.leaveChannel(channel.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadChannels();
        } else {
          this.error = response.message || 'Failed to leave channel';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to leave channel';
        this.isLoading = false;
      }
    });
  }

  canManageChannel(channel: Channel): boolean {
    return this.channelService.canManageChannel(channel);
  }

  canAccessChannel(channel: Channel): boolean {
    return this.channelService.canAccessChannel(channel);
  }

  canManageGroup(): boolean {
    if (!this.currentGroup) return false;
    return this.groupService.canManageGroup(this.currentGroup);
  }

  getCurrentUserId(): string | null {
    return this.authService.getCurrentUser()?.id || null;
  }

  navigateToChannel(channelId: string): void {
    // TODO: Navigate to channel detail/chat view when implemented
    console.log('Navigate to channel:', channelId);
  }

  navigateBackToGroups(): void {
    this.router.navigate(['/groups']);
  }

  getMemberCount(channel: Channel): number {
    // Count unique members (creator is already included in members array)
    return channel.members.length;
  }

  isCreator(channel: Channel): boolean {
    const currentUserId = this.getCurrentUserId();
    return currentUserId === channel.createdBy;
  }

  isMember(channel: Channel): boolean {
    const currentUserId = this.getCurrentUserId();
    return currentUserId ? 
      (channel.members.includes(currentUserId) || channel.createdBy === currentUserId) : 
      false;
  }

  getChannelRole(channel: Channel): string {
    if (this.isCreator(channel)) return 'Creator';
    if (this.isMember(channel)) return 'Member';
    return 'Not a member';
  }

  getChannelRoleBadgeClass(channel: Channel): string {
    if (this.isCreator(channel)) return 'bg-danger';
    if (this.isMember(channel)) return 'bg-primary';
    return 'bg-secondary';
  }

  getGroupName(): string {
    return this.currentGroup?.name || 'Unknown Group';
  }

  getGroupDescription(): string {
    return this.currentGroup?.description || '';
  }

  getGroupMemberCount(): number {
    if (!this.currentGroup) return 0;
    // Count unique members (members + admins)
    // Note: creator is already included in admins array
    const allMembers = new Set([
      ...this.currentGroup.members,
      ...this.currentGroup.admins
    ]);
    return allMembers.size;
  }

  loadChannelMembers(): void {
    if (!this.managingChannel) return;
    
    // Create member objects with proper user data
    this.channelMembers = this.managingChannel.members.map(memberId => {
      const user = this.userCache.get(memberId);
      return {
        id: memberId,
        username: user ? user.username : memberId,
        email: user ? user.email : `${memberId}@example.com`,
        isCreator: memberId === this.managingChannel!.createdBy
      };
    });
  }

  loadAvailableChannelUsers(): void {
    if (!this.managingChannel || !this.currentGroup) return;
    
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        // Filter to only group members who are not already in the channel
        const groupMemberIds = new Set([
          ...this.currentGroup!.members,
          ...this.currentGroup!.admins,
          this.currentGroup!.createdBy
        ]);
        
        const channelMemberIds = new Set(this.managingChannel!.members);
        
        this.availableChannelUsers = response.users.filter(user => 
          user.isActive && 
          groupMemberIds.has(user.id) && 
          !channelMemberIds.has(user.id)
        );
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to load available users';
      }
    });
  }

  addUserToChannel(): void {
    if (!this.managingChannel || !this.selectedUserId) return;
    
    this.isLoading = true;
    this.channelService.addUserToChannel(this.managingChannel.id, this.selectedUserId).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedUserId = '';
          this.loadChannels(); // Refresh the main channels list
          this.loadChannelMembers();
          this.loadAvailableChannelUsers();
        } else {
          this.error = response.message || 'Failed to add user to channel';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to add user to channel';
        this.isLoading = false;
      }
    });
  }

  removeUserFromChannel(userId: string): void {
    if (!this.managingChannel) return;
    
    const member = this.channelMembers.find(m => m.id === userId);
    if (!confirm(`Are you sure you want to remove ${member?.username} from this channel?`)) {
      return;
    }
    
    this.isLoading = true;
    this.channelService.removeUserFromChannel(this.managingChannel.id, userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadChannels(); // Refresh the main channels list
          this.loadChannelMembers();
          this.loadAvailableChannelUsers();
        } else {
          this.error = response.message || 'Failed to remove user from channel';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to remove user from channel';
        this.isLoading = false;
      }
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        // Cache users for quick lookup
        response.users.forEach(user => {
          this.userCache.set(user.id, user);
        });
      },
      error: (error) => {
        console.error('Failed to load users:', error);
      }
    });
  }

  getUsernameById(userId: string): string {
    const user = this.userCache.get(userId);
    return user ? user.username : userId; // Fallback to ID if user not found
  }

  getCreatorName(channel: Channel): string {
    return this.getUsernameById(channel.createdBy);
  }

  isGroupMember(): boolean {
    if (!this.currentGroup) return false;
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return false;
    
    return this.currentGroup.members.includes(currentUserId) || 
           this.currentGroup.admins.includes(currentUserId) || 
           this.currentGroup.createdBy === currentUserId;
  }
}
