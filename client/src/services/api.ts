import { io, Socket } from 'socket.io-client';
import { Auction, Bid, User, Notification, SavedSearch } from '../../../shared/types.js';

const API_BASE = '/api';

// Shared real-time Socket.IO instance
export const socket: Socket = io('/', {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});

function getHeaders() {
  const token = localStorage.getItem('campus_bid_token');
  const userId = localStorage.getItem('campus_bid_user_id');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (userId) {
    headers['x-user-id'] = userId;
  }
  return headers;
}

export const api = {
  // Auth
  async getCurrentUser(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user');
    const data = await res.json();
    return data.user;
  },

  async login(credential: string, password?: string, expectedRole?: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, password, expectedRole }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async register(payload: {
    name: string;
    email: string;
    studentId: string;
    campus?: string;
    hall?: string;
    phone?: string;
    password: string;
    role?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('campus_bid_token');
      localStorage.removeItem('campus_bid_user_id');
    }
  },

  async switchUser(userId: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/switch-user/${userId}`);
    if (!res.ok) throw new Error('Switch user failed');
    return await res.json();
  },

  async switchRole(role: 'buyer' | 'seller'): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/switch-role`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Switch role failed');
    return await res.json();
  },

  async getTestAccounts(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/test-accounts`);
    if (!res.ok) throw new Error('Failed to fetch accounts');
    const data = await res.json();
    return data.users;
  },

  // Auctions
  async getAuctions(params?: {
    q?: string;
    category?: string;
    condition?: string;
    department?: string;
    batchYear?: string;
    status?: string;
    sort?: string;
  }): Promise<Auction[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/auctions?${query}`);
    if (!res.ok) throw new Error('Failed to fetch auctions');
    const data = await res.json();
    return data.auctions;
  },

  async getAuctionById(id: string): Promise<{ auction: Auction }> {
    const res = await fetch(`${API_BASE}/auctions/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load auction details');
    return await res.json();
  },

  async createAuction(payload: any): Promise<{ auction: Auction }> {
    const res = await fetch(`${API_BASE}/auctions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create auction');
    return data;
  },

  async placeBid(auctionId: string, amount: number, maxBudget?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/auctions/${auctionId}/bids`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, maxBudget }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to place bid');
    return data;
  },

  async toggleWatchlist(auctionId: string): Promise<{ watching: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auctions/${auctionId}/watchlist`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return await res.json();
  },

  async askQuestion(auctionId: string, question: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auctions/${auctionId}/qa`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit question');
    return data;
  },

  async answerQuestion(auctionId: string, qaId: string, answer: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auctions/${auctionId}/qa/${qaId}/answer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ answer }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to post answer');
    return data;
  },

  async submitSellerDecision(auctionId: string, decision: 'APPROVE' | 'REJECT', reason?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auctions/${auctionId}/seller-decision`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ decision, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit decision');
    return data;
  },

  async confirmHandover(auctionId: string, handoverCode: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auctions/${auctionId}/handover`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ handoverCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify handover PIN');
    return data;
  },

  // User Hub
  async getMyBids(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/users/bids`, { headers: getHeaders() });
    const data = await res.json();
    return data.bids || [];
  },

  async getMyWatchlist(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/users/watchlist`, { headers: getHeaders() });
    const data = await res.json();
    return data.watchlist || [];
  },

  async getMyListings(): Promise<Auction[]> {
    const res = await fetch(`${API_BASE}/users/listings`, { headers: getHeaders() });
    const data = await res.json();
    return data.listings || [];
  },

  async getSellerDecisions(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/users/seller-decisions`, { headers: getHeaders() });
    const data = await res.json();
    return data.decisions || [];
  },

  async getSavedSearches(): Promise<SavedSearch[]> {
    const res = await fetch(`${API_BASE}/users/saved-searches`, { headers: getHeaders() });
    const data = await res.json();
    return data.savedSearches || [];
  },

  async createSavedSearch(name: string, query?: string, category?: string, maxPrice?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/users/saved-searches`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, query, category, maxPrice }),
    });
    return await res.json();
  },

  async deleteSavedSearch(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/users/saved-searches/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return await res.json();
  },

  async getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const res = await fetch(`${API_BASE}/users/notifications`, { headers: getHeaders() });
    return await res.json();
  },

  async markNotificationRead(id: string): Promise<any> {
    return await fetch(`${API_BASE}/users/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
  },

  async markAllNotificationsRead(): Promise<any> {
    return await fetch(`${API_BASE}/users/notifications/read-all`, {
      method: 'PUT',
      headers: getHeaders(),
    });
  },

  // AI Assistant
  async sendAIMessage(message: string, auctionId?: string): Promise<{ reply: string; toolData?: any }> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, auctionId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI Assistant failed');
    return data;
  },
};
