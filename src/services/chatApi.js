// src/services/chatApi.js
const API_BASE = '/api';

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const startConversation = (otherUserId, orderId=null) =>
  apiCall('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ otherUserId, orderId })
  });

export const fetchConversations = () =>
  apiCall('/chat/conversations');

export const fetchMessages = (conversationId) =>
  apiCall(`/chat/${conversationId}/messages`);

export const sendMessage = (conversationId, payload) =>
  apiCall(`/chat/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const markRead = (conversationId) =>
  apiCall(`/chat/${conversationId}/mark-read`, {
    method: 'POST'
  });

export const unreadTotal = () =>
  apiCall('/chat/unread/count');