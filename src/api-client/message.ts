// packages/api-client/src/message.ts

import { apiClient } from "./axiosClient";

// Temporary type placeholders until Message schemas are generated
type MessageGetManyFormData = any;
type MessageGetByIdFormData = any;
type MessageCreateFormData = any;
type MessageUpdateFormData = any;
type MessageBatchDeleteFormData = any;
type MessageQueryFormData = any;

type Message = any;
type MessageGetUniqueResponse = any;
type MessageGetManyResponse = any;
type MessageCreateResponse = any;
type MessageUpdateResponse = any;
type MessageDeleteResponse = any;
type MessageBatchDeleteResponse = any;
type ViewedMessageCreateResponse = any;

// =====================
// Message Service Class
// =====================

export class MessageService {
  private readonly basePath = "/messages";

  // =====================
  // Query Operations
  // =====================

  async getMessages(params: MessageGetManyFormData = {}): Promise<MessageGetManyResponse> {
    const response = await apiClient.get<MessageGetManyResponse>(this.basePath, { params });
    return response.data;
  }

  async getMessageById(id: string, params?: Omit<MessageGetByIdFormData, "id">): Promise<MessageGetUniqueResponse> {
    const response = await apiClient.get<MessageGetUniqueResponse>(`${this.basePath}/${id}`, {
      params,
    });
    return response.data;
  }

  // =====================
  // CRUD Operations
  // =====================

  async createMessage(data: MessageCreateFormData, params?: MessageQueryFormData): Promise<MessageCreateResponse> {
    const response = await apiClient.post<MessageCreateResponse>(this.basePath, data, { params });
    return response.data;
  }

  async updateMessage(id: string, data: MessageUpdateFormData, params?: MessageQueryFormData): Promise<MessageUpdateResponse> {
    const response = await apiClient.put<MessageUpdateResponse>(`${this.basePath}/${id}`, data, { params });
    return response.data;
  }

  async deleteMessage(id: string): Promise<MessageDeleteResponse> {
    const response = await apiClient.delete<MessageDeleteResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  // =====================
  // Batch Operations
  // =====================

  async batchDeleteMessages(data: MessageBatchDeleteFormData): Promise<MessageBatchDeleteResponse> {
    const response = await apiClient.delete<MessageBatchDeleteResponse>(`${this.basePath}/batch`, { data });
    return response.data;
  }

  // =====================
  // Specialized Operations
  // =====================

  async getMessagesByRecipient(recipientId: string, params: MessageGetManyFormData = {}): Promise<MessageGetManyResponse> {
    return this.getMessages({ ...params, recipientIds: [recipientId] });
  }

  async getMessagesBySender(senderId: string, params: MessageGetManyFormData = {}): Promise<MessageGetManyResponse> {
    return this.getMessages({ ...params, senderIds: [senderId] });
  }

  async getUnviewedMessages(): Promise<Message[]> {
    const response = await apiClient.get<{ success: boolean; data: Message[]; meta: { count: number } }>(`${this.basePath}/unviewed`);
    return response.data.data;
  }

  async getMyMessages(): Promise<(Message & { viewedAt?: Date | null; dismissedAt?: Date | null })[]> {
    const response = await apiClient.get<{ success: boolean; data: (Message & { viewedAt?: Date | null; dismissedAt?: Date | null })[]; meta: { count: number } }>(`${this.basePath}/my-messages`);
    return response.data.data;
  }

  async markAsViewed(messageId: string): Promise<ViewedMessageCreateResponse> {
    const response = await apiClient.post<ViewedMessageCreateResponse>(`${this.basePath}/${messageId}/mark-viewed`);
    return response.data;
  }

  async getMessageStats(messageId: string): Promise<{
    success: boolean;
    data: {
      totalViews: number;
      uniqueViewers: number;
      targetedUsers: number;
      totalDismissals: number;
    };
    message: string;
  }> {
    const response = await apiClient.get(`${this.basePath}/${messageId}/stats`);
    return response.data;
  }

  async dismissMessage(messageId: string): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    const response = await apiClient.post(`${this.basePath}/${messageId}/dismiss`);
    return response.data;
  }

  async archiveMessage(messageId: string): Promise<MessageUpdateResponse> {
    const response = await apiClient.patch<MessageUpdateResponse>(`${this.basePath}/${messageId}/archive`);
    return response.data;
  }

  async activateMessage(messageId: string): Promise<MessageUpdateResponse> {
    const response = await apiClient.patch<MessageUpdateResponse>(`${this.basePath}/${messageId}/activate`);
    return response.data;
  }
}

// =====================
// Service Instances & Exports
// =====================

export const messageService = new MessageService();

// Message exports
export const getMessages = (params?: MessageGetManyFormData) => messageService.getMessages(params || {});
export const getMessageById = (id: string, params?: Omit<MessageGetByIdFormData, "id">) => messageService.getMessageById(id, params);
export const createMessage = (data: MessageCreateFormData, params?: MessageQueryFormData) => messageService.createMessage(data, params);
export const updateMessage = (id: string, data: MessageUpdateFormData, params?: MessageQueryFormData) => messageService.updateMessage(id, data, params);
export const deleteMessage = (id: string) => messageService.deleteMessage(id);
export const batchDeleteMessages = (data: MessageBatchDeleteFormData) => messageService.batchDeleteMessages(data);
export const getMessagesByRecipient = (recipientId: string, params?: MessageGetManyFormData) => messageService.getMessagesByRecipient(recipientId, params || {});
export const getMessagesBySender = (senderId: string, params?: MessageGetManyFormData) => messageService.getMessagesBySender(senderId, params || {});
export const getUnviewedMessages = () => messageService.getUnviewedMessages();
export const getMyMessages = () => messageService.getMyMessages();
export const markAsViewed = (messageId: string) => messageService.markAsViewed(messageId);
export const getMessageStats = (messageId: string) => messageService.getMessageStats(messageId);
export const dismissMessage = (messageId: string) => messageService.dismissMessage(messageId);
export const archiveMessage = (messageId: string) => messageService.archiveMessage(messageId);
export const activateMessage = (messageId: string) => messageService.activateMessage(messageId);
