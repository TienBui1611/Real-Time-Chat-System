import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Group, CreateGroupRequest, UpdateGroupRequest } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly API_URL = 'http://localhost:3000/api/groups';

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

  // Get all groups (filtered by user permissions)
  getAllGroups(): Observable<{ groups: Group[] }> {
    return this.http.get<{ groups: Group[] }>(this.API_URL, {
      headers: this.getAuthHeaders()
    });
  }

  // Get groups for current user
  getUserGroups(): Observable<{ groups: Group[] }> {
    return this.http.get<{ groups: Group[] }>(`${this.API_URL}/my-groups`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get group by ID
  getGroupById(id: string): Observable<{ group: Group }> {
    return this.http.get<{ group: Group }>(`${this.API_URL}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Create new group (Group Admin+ only)
  createGroup(groupRequest: CreateGroupRequest): Observable<{ success: boolean; group: Group; message?: string }> {
    return this.http.post<{ success: boolean; group: Group; message?: string }>(this.API_URL, groupRequest, {
      headers: this.getAuthHeaders()
    });
  }

  // Update group (Creator/Super Admin only)
  updateGroup(id: string, groupRequest: UpdateGroupRequest): Observable<{ success: boolean; group: Group; message?: string }> {
    return this.http.put<{ success: boolean; group: Group; message?: string }>(`${this.API_URL}/${id}`, groupRequest, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete group (Creator/Super Admin only)
  deleteGroup(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Add user to group (Group Admin+ only)
  addUserToGroup(groupId: string, userId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/${groupId}/members`, { userId }, {
      headers: this.getAuthHeaders()
    });
  }

  // Remove user from group (Group Admin+ only)
  removeUserFromGroup(groupId: string, userId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/${groupId}/members/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get group members (workaround for routing issue)
  getGroupMembers(groupId: string): Observable<{ members: any[] }> {
    // Since the direct members endpoint has routing issues, 
    // we'll get the group details and extract member info
    return this.getGroupById(groupId).pipe(
      map(response => {
        if (response.group) {
          // For now, return basic member info from the group
          // In a real app, you'd want full user details
          const memberIds = [...new Set([
            ...response.group.members,
            ...response.group.admins,
            response.group.createdBy
          ])];
          
          // Create basic member objects
          const members = memberIds.map(memberId => ({
            id: memberId,
            username: memberId, // Placeholder - would need user lookup
            email: `${memberId}@example.com`, // Placeholder
            isCreator: memberId === response.group.createdBy,
            isAdmin: response.group.admins.includes(memberId)
          }));
          
          return { members };
        }
        return { members: [] };
      })
    );
  }

  // Check if user can manage group
  canManageGroup(group: Group): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    // Super Admin can manage all groups
    if (this.authService.isSuperAdmin()) return true;

    // Group creator can manage their group
    if (group.createdBy === currentUser.id) return true;

    // Group admins can manage their groups
    if (group.admins.includes(currentUser.id)) return true;

    return false;
  }

  // Check if user is member of group
  isGroupMember(group: Group): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    return group.members.includes(currentUser.id) || 
           group.admins.includes(currentUser.id) || 
           group.createdBy === currentUser.id;
  }

  // Join group (request to join)
  joinGroup(groupId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/${groupId}/join`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Leave group
  leaveGroup(groupId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/${groupId}/leave`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Search groups
  searchGroups(query: string): Observable<{ groups: Group[] }> {
    return this.http.get<{ groups: Group[] }>(`${this.API_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders()
    });
  }
}
