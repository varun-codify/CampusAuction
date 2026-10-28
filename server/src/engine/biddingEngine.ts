import { getDb, schema } from '../db/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

export interface PlaceBidParams {
  auctionId: string;
  bidderId: string;
  amount: number;
  isAutomatic?: boolean;
}

export interface PlaceBidResult {
  bid: any;
  auction: any;
  extended: boolean;
  newClosesAt?: Date;
}

export async function placeBid(params: PlaceBidParams): Promise<PlaceBidResult> {
  const { auctionId, bidderId, amount, isAutomatic = false } = params;
  const db = await getDb();
  const now = new Date();

  // Run in a single authoritative transaction
  return await db.transaction(async (tx: any) => {
    // 1. Fetch auction
    const auctionRows = await tx
      .select()
      .from(schema.auctions)
      .where(eq(schema.auctions.id, auctionId));

    if (auctionRows.length === 0) {
      throw new Error('Auction listing not found.');
    }

    const auction = auctionRows[0];

    // 2. Validate auction state
    if (auction.status !== 'ACTIVE') {
      throw new Error(`Auction is not active (current status: ${auction.status}).`);
    }

    // 3. Strict closing boundary validation
    const closesAtDate = new Date(auction.closesAt);
    if (now.getTime() >= closesAtDate.getTime()) {
      throw new Error('Auction has already closed. Late bids cannot be accepted.');
    }

    // 4. Seller cannot bid on own listing
    if (auction.sellerId === bidderId) {
      throw new Error('Sellers are prohibited from bidding on their own listings.');
    }

    // 5. Authoritative minimum bid verification
    const isFirstBid = Number(auction.totalBids) === 0;
    const minRequired = isFirstBid
      ? Number(auction.startingPrice)
      : Number(auction.currentPrice) + Number(auction.minIncrement);

    if (amount < minRequired) {
      throw new Error(`Bid of ₹${amount.toLocaleString('en-IN')} rejected. Minimum required bid is ₹${minRequired.toLocaleString('en-IN')}.`);
    }

    // 6. Anti-Sniping Rule: Exact 30-second trigger, +60-second extension
    const remainingMs = closesAtDate.getTime() - now.getTime();
    let isExtended = false;
    let newClosesAt = closesAtDate;
    let newExtensionsCount = Number(auction.extensionsCount);

    if (remainingMs <= 30000) {
      isExtended = true;
      newClosesAt = new Date(closesAtDate.getTime() + 60000); // exactly +60 seconds
      newExtensionsCount += 1;
      console.log(`[Anti-Snipe] Bid within last ${Math.round(remainingMs / 1000)}s! Extended auction ${auctionId} by +60s to ${newClosesAt.toISOString()}`);
    }

    // 7. Find previous leading bidder for outbid notification
    const previousLeadingBids = await tx
      .select()
      .from(schema.bids)
      .where(eq(schema.bids.id, auctionId))
      .orderBy(desc(schema.bids.amount))
      .limit(1);

    const prevLeadingBidderId = previousLeadingBids.length > 0 ? previousLeadingBids[0].bidderId : null;

    // 8. Record the bid in the bids audit table
    const bidId = `bid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const [insertedBid] = await tx
      .insert(schema.bids)
      .values({
        id: bidId,
        auctionId,
        bidderId,
        amount,
        isAutomatic,
        createdAt: now,
      })
      .returning();

    // 9. Update the auction state
    const [updatedAuction] = await tx
      .update(schema.auctions)
      .set({
        currentPrice: amount,
        totalBids: Number(auction.totalBids) + 1,
        closesAt: newClosesAt,
        antiSnipeTriggered: isExtended ? true : auction.antiSnipeTriggered,
        extensionsCount: newExtensionsCount,
        updatedAt: now,
      })
      .where(eq(schema.auctions.id, auctionId))
      .returning();

    // 10. Create Outbid Notification if previous leading bidder was outbid
    if (prevLeadingBidderId && prevLeadingBidderId !== bidderId) {
      await tx.insert(schema.notifications).values({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: prevLeadingBidderId,
        title: `Outbid on ${auction.title}`,
        message: `A new leading bid of ₹${amount.toLocaleString('en-IN')} was placed.`,
        type: 'OUTBID',
        link: `/auctions/${auctionId}`,
        isRead: false,
        createdAt: now,
      });
    }

    // 11. Real-time broadcast via Socket.IO
    if (ioInstance) {
      const bidPayload = {
        auctionId,
        bid: insertedBid,
        newPrice: amount,
        totalBids: updatedAuction.totalBids,
        antiSnipeTriggered: updatedAuction.antiSnipeTriggered,
        closesAt: updatedAuction.closesAt,
        extended: isExtended,
      };

      // Broadcast to specific auction room
      ioInstance.to(`auction:${auctionId}`).emit('auction:bid', bidPayload);
      // Also broadcast globally so marketplace cards, search feeds, and buyer dashboards update live
      ioInstance.emit('auction:bid', bidPayload);

      if (isExtended) {
        const extPayload = {
          auctionId,
          newClosesAt: updatedAuction.closesAt,
          extensionsCount: updatedAuction.extensionsCount,
          reason: 'Fair-play anti-snipe: Bid placed in final 30 seconds. Clock extended +60 seconds.',
        };
        ioInstance.to(`auction:${auctionId}`).emit('auction:extended', extPayload);
        ioInstance.emit('auction:extended', extPayload);
      }

      if (prevLeadingBidderId && prevLeadingBidderId !== bidderId) {
        ioInstance.to(`user:${prevLeadingBidderId}`).emit('notification:new', {
          title: `Outbid on ${auction.title}`,
          message: `A new leading bid of ₹${amount.toLocaleString('en-IN')} was placed.`,
          type: 'OUTBID',
          link: `/auctions/${auctionId}`,
        });
      }
    }

    // 12. Evaluate Automatic / Proxy Bidding (Run in next tick to prevent deep recursion)
    setImmediate(async () => {
      try {
        await processAutoBids(auctionId, bidderId, amount);
      } catch (autoErr) {
        console.error('[AutoBid Execution Error]:', autoErr);
      }
    });

    return {
      bid: insertedBid,
      auction: updatedAuction,
      extended: isExtended,
      newClosesAt: isExtended ? newClosesAt : undefined,
    };
  });
}

// Automatic Proxy Bidding Engine
export async function processAutoBids(auctionId: string, currentLeaderId: string, currentPrice: number) {
  const db = await getDb();
  
  // Find highest valid auto-bid for other bidders
  const autoBids = await db
    .select()
    .from(schema.autoBids)
    .where(
      and(
        eq(schema.autoBids.auctionId, auctionId),
        sql`${schema.autoBids.bidderId} != ${currentLeaderId}`
      )
    )
    .orderBy(desc(schema.autoBids.maxBudget), schema.autoBids.createdAt);

  if (autoBids.length === 0) return;

  const topAutoBid = autoBids[0];
  const auctionRows = await db.select().from(schema.auctions).where(eq(schema.auctions.id, auctionId));
  if (auctionRows.length === 0 || auctionRows[0].status !== 'ACTIVE') return;

  const auction = auctionRows[0];
  const minIncrement = Number(auction.minIncrement);
  const nextRequired = currentPrice + minIncrement;

  if (Number(topAutoBid.maxBudget) >= nextRequired) {
    console.log(`[AutoBid] Triggering proxy bid for ${topAutoBid.bidderId}: ₹${nextRequired}`);
    await placeBid({
      auctionId,
      bidderId: topAutoBid.bidderId,
      amount: nextRequired,
      isAutomatic: true,
    });
  }
}
