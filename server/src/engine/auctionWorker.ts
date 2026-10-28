import { getDb, schema } from '../db/index.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { Server as SocketIOServer } from 'socket.io';

let workerInterval: NodeJS.Timeout | null = null;
let ioInstance: SocketIOServer | null = null;

export function setWorkerSocketIO(io: SocketIOServer) {
  ioInstance = io;
}

export async function checkAndFinalizeAuctions() {
  try {
    const db = await getDb();
    const now = new Date();

    // Idempotent query: only auctions that are strictly ACTIVE and whose closing time has passed
    const expiredAuctions = await db
      .select()
      .from(schema.auctions)
      .where(
        and(
          eq(schema.auctions.status, 'ACTIVE'),
          sql`${schema.auctions.closesAt} <= ${now}`
        )
      );

    for (const auction of expiredAuctions) {
      console.log(`[Worker] Finalizing auction: ${auction.id} ("${auction.title}")`);

      await db.transaction(async (tx: any) => {
        // Fetch all bids ordered by highest amount first
        const auctionBids = await tx
          .select()
          .from(schema.bids)
          .where(eq(schema.bids.auctionId, auction.id))
          .orderBy(desc(schema.bids.amount), schema.bids.createdAt);

        if (auctionBids.length === 0) {
          // No bids -> Mark UNSOLD
          await tx
            .update(schema.auctions)
            .set({
              status: 'UNSOLD',
              updatedAt: now,
            })
            .where(eq(schema.auctions.id, auction.id));

          // Notify Seller
          await tx.insert(schema.notifications).values({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: auction.sellerId,
            title: `Auction Closed: ${auction.title}`,
            message: 'Your auction closed with zero bids and has been marked as Unsold.',
            type: 'AUCTION_CLOSING',
            link: `/my-listings`,
            isRead: false,
            createdAt: now,
          });

          if (ioInstance) {
            ioInstance.to(`auction:${auction.id}`).emit('auction:closed', {
              auctionId: auction.id,
              status: 'UNSOLD',
              message: 'Auction closed with no bids.',
            });
          }
        } else {
          // Has valid bids -> determine highest valid bidder as Provisional Winner
          const highestBid = auctionBids[0];
          const handoverPin = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit verification PIN

          await tx
            .update(schema.auctions)
            .set({
              status: 'PENDING_SELLER_DECISION',
              winnerId: highestBid.bidderId,
              winningBidId: highestBid.id,
              handoverCode: handoverPin,
              updatedAt: now,
            })
            .where(eq(schema.auctions.id, auction.id));

          // Notify Seller to approve or reject
          await tx.insert(schema.notifications).values({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: auction.sellerId,
            title: `Seller Decision Required: ${auction.title}`,
            message: `Bidding concluded at ₹${highestBid.amount.toLocaleString('en-IN')}. Please approve or reject the final sale price.`,
            type: 'SELLER_DECISION_REQUIRED',
            link: `/seller-decisions`,
            isRead: false,
            createdAt: now,
          });

          // Notify Provisional Winner
          await tx.insert(schema.notifications).values({
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: highestBid.bidderId,
            title: `Provisional Winner: ${auction.title}`,
            message: `You placed the highest bid of ₹${highestBid.amount.toLocaleString('en-IN')}. Awaiting seller confirmation.`,
            type: 'AUCTION_WON',
            link: `/my-bids`,
            isRead: false,
            createdAt: now,
          });

          if (ioInstance) {
            ioInstance.to(`auction:${auction.id}`).emit('auction:closed', {
              auctionId: auction.id,
              status: 'PENDING_SELLER_DECISION',
              winnerId: highestBid.bidderId,
              winningPrice: highestBid.amount,
            });
            ioInstance.to(`user:${auction.sellerId}`).emit('notification:new', {
              title: `Decision Required: ${auction.title}`,
              message: `Bidding concluded at ₹${highestBid.amount.toLocaleString('en-IN')}.`,
              type: 'SELLER_DECISION_REQUIRED',
            });
          }
        }
      });
    }
  } catch (error) {
    console.error('[Worker Error] checkAndFinalizeAuctions failed:', error);
  }
}

export function startAuctionWorker(intervalMs: number = 5000) {
  if (workerInterval) return;
  console.log(`[Worker] Starting background auction finalization worker (interval: ${intervalMs}ms)...`);
  workerInterval = setInterval(checkAndFinalizeAuctions, intervalMs);
}

export function stopAuctionWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[Worker] Stopped background auction worker.');
  }
}
