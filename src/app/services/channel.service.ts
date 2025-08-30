import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Channel, CreateChannelRequest, UpdateChannelRequest } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private readonly API_URL = 'http://localhost:3000/api/channels';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAuthToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get channels by group ID
  getChannelsByGroup(groupId: string): Observable<{ channels: Channel[] }> {
    return this.http.get<{ channels: Channel[] }>(`${this.API_URL}/group/${groupId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get channel by ID
  getChannelById(id: string): Observable<{ channel: Channel }> {
    return this.http.get<{ channel: Channel }>(`${this.API_URL}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Create new channel (Group Admin+ only)
  createChannel(channelRequest: CreateChannelRequest): Observable<{ success: boolean; channel: Channel; message?: string }> {
    return this.http.post<{ success: boolean; channel: Channel; message?: string }>(this.API_URL, channelRequest, {
      headers: this.getAuthHeaders()
    });
  }

  // Update channel (Creator/Super Admin only)
  updateChannel(id: string, channelRequest: UpdateChannelRequest): Observable<{ success: boolean; channel: Channel; message?: string }> {
    return this.http.put<{ success: boolean; channel: Channel; message?: string }>(`${this.API_URL}/${id}`, channelRequest, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete channel (Creator/Super Admin only)
  deleteChannel(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Add user to channel (Group Admin+ only)
  addUserToChannel(channelId: string, userId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/${channelId}/members`, { userId }, {
      headers: this.getAuthHeaders()
    });
  }

  // Remove user from channel (Group Admin+ only)
  removeUserFromChannel(channelId: string, userId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/${channelId}/members/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get channel members
  getChannelMembers(channelId: string): Observable<{ members: any[] }> {
    return this.http.get<{ members: any[] }>(`${this.API_URL}/${channelId}/members`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get user's accessible channels
  getUserChannels(): Observable<{ channels: Channel[] }> {
    return this.http.get<{ channels: Channel[] }>(`${this.API_URL}/my-channels`, {
      headers: this.getAuthHeaders()
    });
  }

  // Check if user can access channel
  canAccessChannel(channel: Channel): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    // Super Admin can access all channels
    if (this.authService.isSuperAdmin()) return true;

    // Channel creator can access their channel
    if (channel.createdBy === currentUser.id) return true;

    // Channel members can access
    if (channel.members.includes(currentUser.id)) return true;

    return false;
  }

  // Check if user can manage channel
  canManageChannel(channel: Channel): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    // Super Admin can manage all channels
    if (this.authService.isSuperAdmin()) return true;

    // Channel creator can manage their channel
    if (channel.createdBy === currentUser.id) return true;

    // Group Admins can manage channels in their groups (need to check group membership)
    if (this.authService.isGroupAdmin()) {
      // This would need additional logic to check if user is admin of the parent group
      return true; // Simplified for now
    }

    return false;
  }

  // Join channel
  joinChannel(channelId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/${channelId}/join`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Leave channel
  leaveChannel(channelId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/${channelId}/leave`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Search channels within a group
  searchChannels(groupId: string, query: string): Observable<{ channels: Channel[] }> {
    return this.http.get<{ channels: Channel[] }>(`${this.API_URL}/search?groupId=${groupId}&q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders()
    });
  }
}
