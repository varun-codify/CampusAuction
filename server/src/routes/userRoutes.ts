import { Router, Response } from 'express';
import { getDb, schema } from '../db/index.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../auth/authMiddleware.js';

const router = Router();

// 1. My Bids (Active, Leading, Outbid, Won)
router.get('/bids', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;

    // Find all distinct auctions this student has bid on
    const userBids = await db
      .select({
        bidId: schema.bids.id,
        amount: schema.bids.amount,
        createdAt: schema.bids.createdAt,
        isAutomatic: schema.bids.isAutomatic,
        auctionId: schema.auctions.id,
        auctionTitle: schema.auctions.title,
        auctionCategory: schema.auctions.category,
        auctionCondition: schema.auctions.condition,
        auctionImages: schema.auctions.images,
        auctionCurrentPrice: schema.auctions.currentPrice,
        auctionStatus: schema.auctions.status,
        auctionClosesAt: schema.auctions.closesAt,
        auctionTotalBids: schema.auctions.totalBids,
        winnerId: schema.auctions.winnerId,
      })
      .from(schema.bids)
      .innerJoin(schema.auctions, eq(schema.bids.auctionId, schema.auctions.id))
      .where(eq(schema.bids.bidderId, user.id))
      .orderBy(desc(schema.bids.createdAt));

    // Deduplicate by auction, keeping highest user bid
    const auctionMap = new Map();
    for (const b of userBids) {
      if (!auctionMap.has(b.auctionId)) {
        const isLeading = Number(b.amount) === Number(b.auctionCurrentPrice);
        const isWon = b.auctionStatus === 'COMPLETED' && b.winnerId === user.id;
        const isProvisional = (b.auctionStatus === 'PENDING_SELLER_DECISION' || b.auctionStatus === 'RESERVED') && b.winnerId === user.id;

        auctionMap.set(b.auctionId, {
          ...b,
          auctionImages: JSON.parse(b.auctionImages || '[]'),
          myHighBid: b.amount,
          isLeading,
          isWon,
          isProvisional,
        });
      }
    }

    return res.json({ bids: Array.from(auctionMap.values()) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. My Watchlist
router.get('/watchlist', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;

    const watchlistRows = await db
      .select({
        id: schema.watchlists.id,
        createdAt: schema.watchlists.createdAt,
        auction: schema.auctions,
      })
      .from(schema.watchlists)
      .innerJoin(schema.auctions, eq(schema.watchlists.auctionId, schema.auctions.id))
      .where(eq(schema.watchlists.userId, user.id))
      .orderBy(desc(schema.watchlists.createdAt));

    const formatted = watchlistRows.map((r: any) => ({
      ...r,
      auction: {
        ...r.auction,
        images: JSON.parse(r.auction.images || '[]'),
      },
    }));

    return res.json({ watchlist: formatted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. My Listings (Seller Hub)
router.get('/listings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;

    const listings = await db
      .select()
      .from(schema.auctions)
      .where(eq(schema.auctions.sellerId, user.id))
      .orderBy(desc(schema.auctions.createdAt));

    const formatted = listings.map((l: any) => ({
      ...l,
      images: JSON.parse(l.images || '[]'),
    }));

    return res.json({ listings: formatted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Seller Decisions (Items requiring approval)
router.get('/seller-decisions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;

    const decisions = await db
      .select({
        auction: schema.auctions,
        winner: schema.users,
      })
      .from(schema.auctions)
      .leftJoin(schema.users, eq(schema.auctions.winnerId, schema.users.id))
      .where(
        and(
          eq(schema.auctions.sellerId, user.id),
          eq(schema.auctions.status, 'PENDING_SELLER_DECISION')
        )
      )
      .orderBy(desc(schema.auctions.updatedAt));

    const formatted = decisions.map((d: any) => ({
      ...d.auction,
      images: JSON.parse(d.auction.images || '[]'),
      winner: d.winner,
    }));

    return res.json({ decisions: formatted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Saved Searches & Alerts
router.get('/saved-searches', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;

    const searches = await db
      .select()
      .from(schema.savedSearches)
      .where(eq(schema.savedSearches.userId, user.id))
      .orderBy(desc(schema.savedSearches.createdAt));

    return res.json({ savedSearches: searches });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/saved-searches', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { name, query, category, maxPrice, notifyOnMatch = true } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Search alert name is required.' });
    }

    const [saved] = await db
      .insert(schema.savedSearches)
      .values({
        id: `search-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        name: name.trim(),
        query: query?.trim() || null,
        category: category || null,
        maxPrice: maxPrice ? Number(maxPrice) : null,
        notifyOnMatch,
        createdAt: new Date(),
      })
      .returning();

    return res.status(201).json({ savedSearch: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/saved-searches/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;

    await db
      .delete(schema.savedSearches)
      .where(
        and(
          eq(schema.savedSearches.id, req.params.id),
          eq(schema.savedSearches.userId, user.id)
        )
      );

    return res.json({ success: true, message: 'Saved search removed.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. In-App Notifications
router.get('/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;

    const notifs = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, user.id))
      .orderBy(desc(schema.notifications.createdAt));

    const unreadCount = notifs.filter((n: any) => !n.isRead).length;

    return res.json({ notifications: notifs, unreadCount });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;

    await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.notifications.id, req.params.id),
          eq(schema.notifications.userId, user.id)
        )
      );

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;

    await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.userId, user.id));

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
