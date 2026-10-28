import { describe, it, expect, beforeAll } from 'vitest';
import { getDb, schema } from '../db/index.js';
import { placeBid } from '../engine/biddingEngine.js';
import { checkAndFinalizeAuctions } from '../engine/auctionWorker.js';
import { eq } from 'drizzle-orm';

describe('Campus Auction Bidding Engine Tests', () => {
  let db: any;
  const testAuctionId = `test-auc-${Date.now()}`;
  const sellerId = 'usr-rohan-24';
  const bidder1Id = 'usr-ananya-25';
  const bidder2Id = 'usr-vikram-23';

  beforeAll(async () => {
    db = await getDb();

    // Ensure correct user roles for testing (matching seed data)
    // Use PGlite raw execution like the index.ts migration
    const pglite = db.$client; // Get underlying PGlite connection
    if (pglite) {
      await pglite.exec(`UPDATE users SET role = 'seller' WHERE id = '${sellerId}'`);
      await pglite.exec(`UPDATE users SET role = 'buyer' WHERE id IN ('${bidder1Id}', '${bidder2Id}')`);
    }

    // Insert a fresh test auction
    const now = new Date();
    await db.insert(schema.auctions).values({
      id: testAuctionId,
      title: 'Test Casio Calculator',
      description: 'Used for unit testing auction bidding rules.',
      category: 'Electronics & Calculators',
      condition: 'Like New',
      images: JSON.stringify(['https://example.com/calc.jpg']),
      startingPrice: 500,
      currentPrice: 500,
      minIncrement: 50,
      sellerId: sellerId,
      status: 'ACTIVE',
      startTime: now,
      closesAt: new Date(now.getTime() + 60000), // 60s from now
      antiSnipeTriggered: false,
      extensionsCount: 0,
      handoverLocation: 'Library',
      totalBids: 0,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('1. Rejects a first bid below starting price', async () => {
    await expect(
      placeBid({
        auctionId: testAuctionId,
        bidderId: bidder1Id,
        amount: 400, // starting is 500
      })
    ).rejects.toThrow(/Minimum required bid is ₹500/);
  });

  it('2. Accepts a valid first bid at or above starting price', async () => {
    const res = await placeBid({
      auctionId: testAuctionId,
      bidderId: bidder1Id,
      amount: 500,
    });
    expect(res.bid.amount).toBe(500);
    expect(res.auction.currentPrice).toBe(500);
    expect(res.auction.totalBids).toBe(1);
  });

  it('3. Rejects subsequent bids that do not meet currentPrice + minIncrement', async () => {
    // Current is 500, min increment is 50 -> must be >= 550
    await expect(
      placeBid({
        auctionId: testAuctionId,
        bidderId: bidder2Id,
        amount: 520,
      })
    ).rejects.toThrow(/Minimum required bid is ₹550/);
  });

  it('4. Rejects a bid from the seller on their own listing', async () => {
    await expect(
      placeBid({
        auctionId: testAuctionId,
        bidderId: sellerId,
        amount: 600,
      })
    ).rejects.toThrow(/Seller/);
  });

  it('5. Triggers anti-sniping extension when bid placed in final 30 seconds', async () => {
    // Set closesAt to 15 seconds from now
    const now = new Date();
    const endingSoon = new Date(now.getTime() + 15000); // 15s remaining <= 30s
    await db.update(schema.auctions).set({ closesAt: endingSoon }).where(eq(schema.auctions.id, testAuctionId));

    const res = await placeBid({
      auctionId: testAuctionId,
      bidderId: bidder2Id,
      amount: 600,
    });

    expect(res.extended).toBe(true);
    expect(res.auction.antiSnipeTriggered).toBe(true);
    expect(res.auction.extensionsCount).toBeGreaterThanOrEqual(1);

    // Verified extension: new closesAt should be approx endingSoon + 60s
    const diff = new Date(res.auction.closesAt).getTime() - endingSoon.getTime();
    expect(diff).toBe(60000);
  });

  it('6. Rejects bids after closing timestamp', async () => {
    // Manually set closesAt to past
    const past = new Date(Date.now() - 5000);
    await db.update(schema.auctions).set({ closesAt: past }).where(eq(schema.auctions.id, testAuctionId));

    await expect(
      placeBid({
        auctionId: testAuctionId,
        bidderId: bidder1Id,
        amount: 800,
      })
    ).rejects.toThrow(/Auction has already closed/);
  });

  it('7. Idempotently finalizes expired auction and designates Provisional Winner', async () => {
    await checkAndFinalizeAuctions();

    const [finalAuction] = await db.select().from(schema.auctions).where(eq(schema.auctions.id, testAuctionId));
    expect(finalAuction.status).toBe('PENDING_SELLER_DECISION');
    expect(finalAuction.winnerId).toBe(bidder2Id);
    expect(finalAuction.handoverCode).toBeDefined();

    // Second run should be idempotent
    await checkAndFinalizeAuctions();
    const [idempotentCheck] = await db.select().from(schema.auctions).where(eq(schema.auctions.id, testAuctionId));
    expect(idempotentCheck.status).toBe('PENDING_SELLER_DECISION');
  });
});
