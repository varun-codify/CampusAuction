import { pgTable, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  studentId: varchar('student_id', { length: 64 }).notNull().unique(),
  campus: varchar('campus', { length: 255 }).notNull().default('IIT Kharagpur'),
  hall: varchar('hall', { length: 255 }).notNull().default('Nehru Hall'),
  department: varchar('department', { length: 50 }).notNull().default('Others'),
  batchYear: varchar('batch_year', { length: 10 }).notNull().default('2026'),
  handle: varchar('handle', { length: 32 }).notNull().unique(),
  phone: varchar('phone', { length: 32 }),
  isVerified: boolean('is_verified').notNull().default(true),
  trustScore: integer('trust_score').notNull().default(98),
  role: varchar('role', { length: 32 }).notNull().default('student'),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const auctions = pgTable('auctions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 64 }).notNull(),
  condition: varchar('condition', { length: 64 }).notNull(),
  images: text('images').notNull(), // JSON array
  startingPrice: integer('starting_price').notNull(),
  currentPrice: integer('current_price').notNull(),
  minIncrement: integer('min_increment').notNull().default(50),
  reservePrice: integer('reserve_price'),
  sellerId: varchar('seller_id', { length: 64 }).notNull().references(() => users.id),
  status: varchar('status', { length: 32 }).notNull().default('ACTIVE'),
  startTime: timestamp('start_time').notNull().defaultNow(),
  closesAt: timestamp('closes_at').notNull(),
  antiSnipeTriggered: boolean('anti_snipe_triggered').notNull().default(false),
  extensionsCount: integer('extensions_count').notNull().default(0),
  winnerId: varchar('winner_id', { length: 64 }).references(() => users.id),
  winningBidId: varchar('winning_bid_id', { length: 64 }),
  handoverLocation: varchar('handover_location', { length: 255 }).notNull().default('Main Campus Library Steps'),
  handoverCode: varchar('handover_code', { length: 16 }),
  sellerApprovedAt: timestamp('seller_approved_at'),
  handoverCompletedAt: timestamp('handover_completed_at'),
  cancellationReason: text('cancellation_reason'),
  totalBids: integer('total_bids').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const bids = pgTable('bids', {
  id: varchar('id', { length: 64 }).primaryKey(),
  auctionId: varchar('auction_id', { length: 64 }).notNull().references(() => auctions.id),
  bidderId: varchar('bidder_id', { length: 64 }).notNull().references(() => users.id),
  amount: integer('amount').notNull(),
  isAutomatic: boolean('is_automatic').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const autoBids = pgTable('auto_bids', {
  id: varchar('id', { length: 64 }).primaryKey(),
  auctionId: varchar('auction_id', { length: 64 }).notNull().references(() => auctions.id),
  bidderId: varchar('bidder_id', { length: 64 }).notNull().references(() => users.id),
  maxBudget: integer('max_budget').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const questionAnswers = pgTable('question_answers', {
  id: varchar('id', { length: 64 }).primaryKey(),
  auctionId: varchar('auction_id', { length: 64 }).notNull().references(() => auctions.id),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id),
  question: text('question').notNull(),
  answer: text('answer'),
  answeredAt: timestamp('answered_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const watchlists = pgTable('watchlists', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id),
  auctionId: varchar('auction_id', { length: 64 }).notNull().references(() => auctions.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const savedSearches = pgTable('saved_searches', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  query: varchar('query', { length: 255 }),
  category: varchar('category', { length: 64 }),
  maxPrice: integer('max_price'),
  notifyOnMatch: boolean('notify_on_match').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 64 }).notNull(),
  link: text('link'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
