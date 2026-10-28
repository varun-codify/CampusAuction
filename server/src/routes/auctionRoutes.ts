import { Router, Response } from 'express';
import { getDb, schema } from '../db/index.js';
import { eq, desc, and, or, sql, like } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../auth/authMiddleware.js';
import { placeBid } from '../engine/biddingEngine.js';
import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setAuctionRoutesSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

const router = Router();

// 1. List / Search Auctions with Filtering
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { q, category, condition, status, sort } = req.query;

    let query = db
      .select({
        id: schema.auctions.id,
        title: schema.auctions.title,
        description: schema.auctions.description,
        category: schema.auctions.category,
        condition: schema.auctions.condition,
        images: schema.auctions.images,
        startingPrice: schema.auctions.startingPrice,
        currentPrice: schema.auctions.currentPrice,
        minIncrement: schema.auctions.minIncrement,
        reservePrice: schema.auctions.reservePrice,
        sellerId: schema.auctions.sellerId,
        status: schema.auctions.status,
        startTime: schema.auctions.startTime,
        closesAt: schema.auctions.closesAt,
        antiSnipeTriggered: schema.auctions.antiSnipeTriggered,
        extensionsCount: schema.auctions.extensionsCount,
        handoverLocation: schema.auctions.handoverLocation,
        totalBids: schema.auctions.totalBids,
        createdAt: schema.auctions.createdAt,
        sellerName: schema.users.name,
        sellerCampus: schema.users.campus,
        sellerHall: schema.users.hall,
        sellerTrustScore: schema.users.trustScore,
        sellerVerified: schema.users.isVerified,
      })
      .from(schema.auctions)
      .leftJoin(schema.users, eq(schema.auctions.sellerId, schema.users.id));

    const conditions: any[] = [];

    // Search query in title or description
    if (q && typeof q === 'string') {
      const searchTerm = `%${q.trim()}%`;
      conditions.push(
        or(
          like(schema.auctions.title, searchTerm),
          like(schema.auctions.description, searchTerm)
        )
      );
    }

    // Category filter
    if (category && typeof category === 'string' && category !== 'All') {
      conditions.push(eq(schema.auctions.category, category));
    }

    // Condition filter
    if (condition && typeof condition === 'string' && condition !== 'All') {
      conditions.push(eq(schema.auctions.condition, condition));
    }

    // Status filter
    if (status && typeof status === 'string') {
      conditions.push(eq(schema.auctions.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sorting
    if (sort === 'price_asc') {
      query = query.orderBy(schema.auctions.currentPrice);
    } else if (sort === 'price_desc') {
      query = query.orderBy(desc(schema.auctions.currentPrice));
    } else if (sort === 'bids_desc') {
      query = query.orderBy(desc(schema.auctions.totalBids));
    } else if (sort === 'closing_soon') {
      query = query.orderBy(schema.auctions.closesAt);
    } else {
      query = query.orderBy(desc(schema.auctions.createdAt));
    }

    const rows = await query;
    const formatted = rows.map((r: any) => ({
      ...r,
      images: JSON.parse(r.images || '[]'),
      seller: {
        id: r.sellerId,
        name: r.sellerName,
        campus: r.sellerCampus,
        hall: r.sellerHall,
        trustScore: r.sellerTrustScore,
        isVerified: r.sellerVerified,
      },
    }));

    return res.json({ auctions: formatted });
  } catch (err: any) {
    console.error('List auctions error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. Get Auction Details by ID
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const auctionRows = await db
      .select()
      .from(schema.auctions)
      .where(eq(schema.auctions.id, req.params.id));

    if (auctionRows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    const auction = auctionRows[0];
    const sellerRows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, auction.sellerId));

    let winner = null;
    if (auction.winnerId) {
      const winnerRows = await db.select().from(schema.users).where(eq(schema.users.id, auction.winnerId));
      if (winnerRows.length > 0) winner = winnerRows[0];
    }

    // Fetch bid history audit ledger
    const bidRows = await db
      .select({
        id: schema.bids.id,
        auctionId: schema.bids.auctionId,
        bidderId: schema.bids.bidderId,
        amount: schema.bids.amount,
        isAutomatic: schema.bids.isAutomatic,
        createdAt: schema.bids.createdAt,
        bidderName: schema.users.name,
        bidderStudentId: schema.users.studentId,
        bidderHall: schema.users.hall,
      })
      .from(schema.bids)
      .leftJoin(schema.users, eq(schema.bids.bidderId, schema.users.id))
      .where(eq(schema.bids.auctionId, auction.id))
      .orderBy(desc(schema.bids.amount), schema.bids.createdAt);

    // Fetch Q&A
    const qaRows = await db
      .select({
        id: schema.questionAnswers.id,
        auctionId: schema.questionAnswers.auctionId,
        userId: schema.questionAnswers.userId,
        question: schema.questionAnswers.question,
        answer: schema.questionAnswers.answer,
        answeredAt: schema.questionAnswers.answeredAt,
        createdAt: schema.questionAnswers.createdAt,
        userName: schema.users.name,
        userAvatar: schema.users.avatarUrl,
      })
      .from(schema.questionAnswers)
      .leftJoin(schema.users, eq(schema.questionAnswers.userId, schema.users.id))
      .where(eq(schema.questionAnswers.auctionId, auction.id))
      .orderBy(desc(schema.questionAnswers.createdAt));

    return res.json({
      auction: {
        ...auction,
        images: JSON.parse(auction.images || '[]'),
        seller: sellerRows[0] || null,
        winner,
        bids: bidRows,
        qa: qaRows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Create New Auction Listing (Authenticated)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const {
      title,
      description,
      category,
      condition,
      startingPrice,
      minIncrement = 50,
      reservePrice,
      durationMinutes = 1440, // default 24 hours
      handoverLocation = 'Main Campus Library Steps',
      images = [],
    } = req.body;

    // Server-side validation
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ error: 'Title must be at least 3 characters long.' });
    }
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters long.' });
    }
    if (!startingPrice || Number(startingPrice) <= 0) {
      return res.status(400).json({ error: 'Starting price must be greater than ₹0.' });
    }

    const now = new Date();
    const closesAt = new Date(now.getTime() + Number(durationMinutes) * 60 * 1000);
    const auctionId = `auc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newAuction = {
      id: auctionId,
      title: title.trim(),
      description: description.trim(),
      category: category || 'Other',
      condition: condition || 'Good',
      images: JSON.stringify(images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200'
      ]),
      startingPrice: Math.round(Number(startingPrice)),
      currentPrice: Math.round(Number(startingPrice)),
      minIncrement: Math.round(Number(minIncrement)),
      reservePrice: reservePrice ? Math.round(Number(reservePrice)) : null,
      sellerId: user.id,
      status: 'ACTIVE',
      startTime: now,
      closesAt,
      antiSnipeTriggered: false,
      extensionsCount: 0,
      handoverLocation: handoverLocation.trim(),
      handoverCode: Math.floor(1000 + Math.random() * 9000).toString(),
      totalBids: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.auctions).values(newAuction);

    const fullAuction = {
      ...newAuction,
      images: JSON.parse(newAuction.images),
      seller: {
        id: user.id,
        name: user.name,
        campus: user.campus,
        hall: user.hall,
        trustScore: user.trustScore,
        isVerified: user.isVerified,
      },
    };

    // Broadcast new listing to all active buyers in real-time!
    if (ioInstance) {
      ioInstance.emit('auction:created', fullAuction);
      console.log(`[Socket.IO] Real-time broadcast: New auction "${newAuction.title}" listed by ${user.name}`);
    }

    // Notify users who have matching saved searches!
    setImmediate(async () => {
      try {
        const searches = await db.select().from(schema.savedSearches).where(eq(schema.savedSearches.notifyOnMatch, true));
        for (const s of searches) {
          let match = false;
          if (s.query && title.toLowerCase().includes(s.query.toLowerCase())) match = true;
          if (s.category && s.category === category) match = true;

          if (match && s.userId !== user.id) {
            const notif = {
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              userId: s.userId,
              title: `Search Match: ${s.name}`,
              message: `A new item matching your alert was listed: "${title}" for ₹${startingPrice}.`,
              type: 'SEARCH_MATCH',
              link: `/auctions/${auctionId}`,
              isRead: false,
              createdAt: new Date(),
            };
            await db.insert(schema.notifications).values(notif);

            if (ioInstance) {
              ioInstance.to(`user:${s.userId}`).emit('notification:new', notif);
            }
          }
        }
      } catch (matchErr) {
        console.error('[Saved Search Match Notification Error]:', matchErr);
      }
    });

    return res.status(201).json({ auction: fullAuction });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Place Bid (Authoritative Engine)
router.post('/:id/bids', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { amount, maxBudget } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid bid amount is required.' });
    }

    const result = await placeBid({
      auctionId: req.params.id,
      bidderId: user.id,
      amount: Math.round(Number(amount)),
    });

    // If maxBudget was provided, register or update auto-bid
    if (maxBudget && Number(maxBudget) > Number(amount)) {
      const db = await getDb();
      const existing = await db
        .select()
        .from(schema.autoBids)
        .where(
          and(
            eq(schema.autoBids.auctionId, req.params.id),
            eq(schema.autoBids.bidderId, user.id)
          )
        );

      if (existing.length > 0) {
        await db
          .update(schema.autoBids)
          .set({ maxBudget: Math.round(Number(maxBudget)), updatedAt: new Date() })
          .where(eq(schema.autoBids.id, existing[0].id));
      } else {
        await db.insert(schema.autoBids).values({
          id: `auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          auctionId: req.params.id,
          bidderId: user.id,
          maxBudget: Math.round(Number(maxBudget)),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return res.json({
      success: true,
      message: 'Bid placed successfully!',
      ...result,
    });
  } catch (err: any) {
    console.error('Bid error:', err.message);
    return res.status(400).json({ error: err.message });
  }
});

// 5. Seller Decision: Approve or Reject
router.post('/:id/seller-decision', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { decision, reason } = req.body; // 'APPROVE' or 'REJECT'

    const auctionRows = await db.select().from(schema.auctions).where(eq(schema.auctions.id, req.params.id));
    if (auctionRows.length === 0) return res.status(404).json({ error: 'Auction not found' });

    const auction = auctionRows[0];
    if (auction.sellerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the seller can approve or reject this auction outcome.' });
    }

    if (auction.status !== 'PENDING_SELLER_DECISION') {
      return res.status(400).json({ error: `Cannot make decision on auction with status ${auction.status}` });
    }

    const now = new Date();
    if (decision === 'APPROVE') {
      await db
        .update(schema.auctions)
        .set({
          status: 'RESERVED',
          sellerApprovedAt: now,
          updatedAt: now,
        })
        .where(eq(schema.auctions.id, auction.id));

      // Notify winner that item is reserved for handover
      if (auction.winnerId) {
        await db.insert(schema.notifications).values({
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: auction.winnerId,
          title: `Seller Approved: ${auction.title}`,
          message: `The seller approved the sale of ₹${auction.currentPrice.toLocaleString('en-IN')}. Please meet for campus handover!`,
          type: 'HANDOVER_READY',
          link: `/handover/${auction.id}`,
          isRead: false,
          createdAt: now,
        });
      }

      return res.json({ success: true, status: 'RESERVED', message: 'Sale price approved! Item is reserved for handover.' });
    } else {
      await db
        .update(schema.auctions)
        .set({
          status: 'CANCELLED',
          cancellationReason: reason || 'Seller rejected provisional winning price.',
          updatedAt: now,
        })
        .where(eq(schema.auctions.id, auction.id));

      if (auction.winnerId) {
        await db.insert(schema.notifications).values({
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: auction.winnerId,
          title: `Auction Cancelled by Seller: ${auction.title}`,
          message: `The seller declined to finalize the sale at ₹${auction.currentPrice.toLocaleString('en-IN')}. Reason: ${reason || 'Below expectations'}`,
          type: 'SYSTEM',
          link: `/my-bids`,
          isRead: false,
          createdAt: now,
        });
      }

      return res.json({ success: true, status: 'CANCELLED', message: 'Auction outcome rejected by seller.' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. Confirmed Campus Handover (PIN Verification)
router.post('/:id/handover', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { handoverCode } = req.body;

    const auctionRows = await db.select().from(schema.auctions).where(eq(schema.auctions.id, req.params.id));
    if (auctionRows.length === 0) return res.status(404).json({ error: 'Auction not found' });

    const auction = auctionRows[0];
    if (auction.status !== 'RESERVED') {
      return res.status(400).json({ error: `Handover can only be confirmed for RESERVED items (current: ${auction.status}).` });
    }

    // Handover code verification
    if (!handoverCode || handoverCode.trim() !== auction.handoverCode) {
      return res.status(400).json({ error: 'Invalid 4-digit handover verification PIN.' });
    }

    const now = new Date();
    await db
      .update(schema.auctions)
      .set({
        status: 'COMPLETED',
        handoverCompletedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.auctions.id, auction.id));

    // Increase trust scores for successful campus transaction!
    await db.update(schema.users).set({ trustScore: sql`${schema.users.trustScore} + 1` }).where(eq(schema.users.id, auction.sellerId));
    if (auction.winnerId) {
      await db.update(schema.users).set({ trustScore: sql`${schema.users.trustScore} + 1` }).where(eq(schema.users.id, auction.winnerId));
    }

    return res.json({
      success: true,
      status: 'COMPLETED',
      message: 'Campus handover confirmed! Transaction successfully completed.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 7. Watchlist Toggle
router.post('/:id/watchlist', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const auctionId = req.params.id;

    const existing = await db
      .select()
      .from(schema.watchlists)
      .where(
        and(
          eq(schema.watchlists.userId, user.id),
          eq(schema.watchlists.auctionId, auctionId)
        )
      );

    if (existing.length > 0) {
      await db.delete(schema.watchlists).where(eq(schema.watchlists.id, existing[0].id));
      return res.json({ watching: false, message: 'Removed from watchlist.' });
    } else {
      await db.insert(schema.watchlists).values({
        id: `watch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        auctionId,
        createdAt: new Date(),
      });
      return res.json({ watching: true, message: 'Saved to watchlist.' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 8. Q&A Ask Question
router.post('/:id/qa', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { question } = req.body;

    if (!question || question.trim().length < 3) {
      return res.status(400).json({ error: 'Question must be at least 3 characters.' });
    }

    const [newQA] = await db
      .insert(schema.questionAnswers)
      .values({
        id: `qa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        auctionId: req.params.id,
        userId: user.id,
        question: question.trim(),
        createdAt: new Date(),
      })
      .returning();

    return res.status(201).json({ qa: newQA });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 9. Q&A Answer Question (Seller only)
router.post('/:id/qa/:qaId/answer', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { answer } = req.body;

    const auctionRows = await db.select().from(schema.auctions).where(eq(schema.auctions.id, req.params.id));
    if (auctionRows.length === 0) return res.status(404).json({ error: 'Auction not found' });

    if (auctionRows[0].sellerId !== user.id) {
      return res.status(403).json({ error: 'Only the seller can answer questions for this listing.' });
    }

    const [updatedQA] = await db
      .update(schema.questionAnswers)
      .set({
        answer: answer.trim(),
        answeredAt: new Date(),
      })
      .where(eq(schema.questionAnswers.id, req.params.qaId))
      .returning();

    return res.json({ qa: updatedQA });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
