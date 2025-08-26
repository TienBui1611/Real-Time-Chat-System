export interface Channel {
  id: string;
  name: string;
  description: string;
  groupId: string;
  createdBy: string;
  members: string[];
  createdAt: Date;
  isActive: boolean;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
  groupId: string;
}

export interface UpdateChannelRequest {
  name?: string;
  description?: string;
}
