export type UserRole = 'buyer' | 'seller' | 'student' | 'admin' | 'moderator';

export type Department = 'Computer Science' | 'Electronics' | 'Electrical' | 'Mechanical' | 'Civil' | 'Aerospace' | 'Mathematics' | 'Physics' | 'Chemistry' | 'Others';

export type BatchYear = '2023' | '2024' | '2025' | '2026' | '2027' | 'Others';

export interface User {
  id: string;
  email: string;
  name: string;
  studentId: string;
  campus: string;
  hall: string;
  department: Department;
  batchYear: BatchYear;
  handle: string;
  phone?: string;
  isVerified: boolean;
  trustScore: number;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export type AuctionCategory =
  | 'Cycles & Commute'
  | 'Electronics & Calculators'
  | 'Books & Academics'
  | 'Hostel & Room'
  | 'Lab & Instruments'
  | 'Other';

export type ItemCondition = 'Like New' | 'Good' | 'Fair' | 'Needs Repair';

export type AuctionStatus =
  | 'ACTIVE'
  | 'PENDING_SELLER_DECISION'
  | 'UNSOLD'
  | 'RESERVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PICKUP_FAILED';

export interface Auction {
  id: string;
  title: string;
  description: string;
  category: AuctionCategory;
  condition: ItemCondition;
  images: string[];
  startingPrice: number;
  currentPrice: number;
  minIncrement: number;
  reservePrice?: number | null;
  sellerId: string;
  seller?: User;
  status: AuctionStatus;
  startTime: string;
  closesAt: string;
  antiSnipeTriggered: boolean;
  extensionsCount: number;
  winnerId?: string | null;
  winner?: User | null;
  winningBidId?: string | null;
  handoverLocation: string;
  handoverCode?: string | null;
  sellerApprovedAt?: string | null;
  handoverCompletedAt?: string | null;
  cancellationReason?: string | null;
  totalBids: number;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName?: string;
  bidderStudentId?: string;
  amount: number;
  isAutomatic: boolean;
  createdAt: string;
}

export interface AutoBid {
  id: string;
  auctionId: string;
  bidderId: string;
  maxBudget: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionAnswer {
  id: string;
  auctionId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  question: string;
  answer?: string | null;
  answeredAt?: string | null;
  createdAt: string;
}

export interface WatchlistEntry {
  id: string;
  userId: string;
  auctionId: string;
  auction?: Auction;
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query?: string;
  category?: string;
  maxPrice?: number;
  notifyOnMatch: boolean;
  matchCount?: number;
  createdAt: string;
}

export type NotificationType =
  | 'OUTBID'
  | 'AUCTION_WON'
  | 'AUCTION_CLOSING'
  | 'SELLER_DECISION_REQUIRED'
  | 'HANDOVER_READY'
  | 'QA_RESPONSE'
  | 'SEARCH_MATCH'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PlaceBidPayload {
  auctionId: string;
  amount: number;
  maxBudget?: number; // for proxy bidding
}

export interface CreateAuctionPayload {
  title: string;
  description: string;
  category: AuctionCategory;
  condition: ItemCondition;
  startingPrice: number;
  minIncrement?: number;
  reservePrice?: number;
  durationMinutes: number; // e.g. 60 min, 1440 min (24h)
  handoverLocation: string;
  images?: string[];
}

export interface SellerDecisionPayload {
  auctionId: string;
  decision: 'APPROVE' | 'REJECT';
  reason?: string;
}

export interface HandoverConfirmationPayload {
  auctionId: string;
  handoverCode: string;
}
