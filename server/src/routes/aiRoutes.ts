import { Router, Response } from 'express';
import { getDb, schema } from '../db/index.js';
import { eq, and, or, like, desc } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../auth/authMiddleware.js';

const router = Router();

// Controlled AI Tools Registry
async function searchMarketplaceTool(query?: string, category?: string, maxPrice?: number) {
  const db = await getDb();
  const conditions = [eq(schema.auctions.status, 'ACTIVE')];

  if (query) {
    conditions.push(or(
      like(schema.auctions.title, `%${query}%`),
      like(schema.auctions.description, `%${query}%`)
    )!);
  }
  if (category && category !== 'All') {
    conditions.push(eq(schema.auctions.category, category));
  }

  const results = await db.select().from(schema.auctions).where(and(...conditions)).limit(5);
  return results.map((r: any) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    currentPrice: `₹${r.currentPrice.toLocaleString('en-IN')}`,
    closesAt: new Date(r.closesAt).toLocaleTimeString(),
    handoverLocation: r.handoverLocation,
  }));
}

function estimateFairMarketValueTool(itemTitle: string, category: string, condition: string) {
  const titleLower = itemTitle.toLowerCase();
  let baseRange = { min: 500, max: 1500, note: 'General student equipment' };

  if (category === 'Cycles & Commute' || titleLower.includes('cycle') || titleLower.includes('bike')) {
    baseRange = { min: 1800, max: 3500, note: 'Standard campus gear cycles (Hero, Hercules, Firefox)' };
  } else if (category === 'Electronics & Calculators' || titleLower.includes('calc') || titleLower.includes('casio')) {
    baseRange = { min: 650, max: 1200, note: 'Engineering scientific calculators (Casio fx-991EX / ClassWiz)' };
  } else if (category === 'Books & Academics' || titleLower.includes('book')) {
    baseRange = { min: 300, max: 800, note: 'Standard hardcover engineering core textbooks' };
  } else if (category === 'Hostel & Room' || titleLower.includes('chair') || titleLower.includes('table')) {
    baseRange = { min: 1200, max: 2800, note: 'Ergonomic hostel furniture and appliances' };
  }

  // Adjust for condition
  let multiplier = 1.0;
  if (condition === 'Like New') multiplier = 1.25;
  if (condition === 'Fair') multiplier = 0.8;
  if (condition === 'Needs Repair') multiplier = 0.5;

  return {
    itemTitle,
    category,
    condition,
    suggestedStartingPrice: Math.round(baseRange.min * multiplier / 50) * 50,
    estimatedFairMarketValue: `₹${Math.round(baseRange.min * multiplier).toLocaleString('en-IN')} - ₹${Math.round(baseRange.max * multiplier).toLocaleString('en-IN')}`,
    valuationGuidance: baseRange.note,
    campusRecommendation: 'Start slightly below fair market value (20-30% lower) to foster initial competitive bidding on campus.',
  };
}

async function checkLiveAuctionStatusTool(auctionId: string) {
  const db = await getDb();
  const rows = await db.select().from(schema.auctions).where(eq(schema.auctions.id, auctionId));
  if (rows.length === 0) return { error: 'Auction not found' };

  const a = rows[0];
  const remainingSeconds = Math.max(0, Math.round((new Date(a.closesAt).getTime() - Date.now()) / 1000));

  return {
    title: a.title,
    currentPrice: `₹${a.currentPrice.toLocaleString('en-IN')}`,
    status: a.status,
    totalBids: a.totalBids,
    remainingTime: `${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s`,
    antiSnipeActive: a.antiSnipeTriggered,
    handoverLocation: a.handoverLocation,
  };
}

function getCampusFairPlayRulesTool() {
  return {
    antiSnipingRule: 'If any verified bid is placed within the final 30 seconds before scheduled close, the countdown clock automatically extends by exactly +60 seconds. This guarantees all students an equal chance to react without sniper bots.',
    bidIncrementRule: 'Each bid must equal or exceed current leading price plus minimum increment (default ₹50).',
    sellerDecisionRule: 'When bidding ends, the highest bidder is Provisional Winner. The seller reviews and formally approves or rejects the final price.',
    campusHandoverRule: 'Physical item exchange occurs at verified campus locations (e.g. Central Library Steps, Hall Security). The seller confirms transaction completion by entering the 4-digit PIN provided to the winner.',
  };
}

// POST /api/ai/chat
router.post('/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { message, auctionId } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const msgLower = message.toLowerCase();
    let responseText = '';
    let toolResult: any = null;

    // Dispatch controlled tools based on intent
    if (msgLower.includes('anti-snipe') || msgLower.includes('anti snipe') || msgLower.includes('rule') || msgLower.includes('handover') || msgLower.includes('fair play')) {
      toolResult = getCampusFairPlayRulesTool();
      responseText = `Here are the official **Campus Auction Fair-Play Rules**:\n\n` +
        `• **Anti-Sniping Protection**: ${toolResult.antiSnipingRule}\n\n` +
        `• **Minimum Bid Increment**: ${toolResult.bidIncrementRule}\n\n` +
        `• **Seller Approval**: ${toolResult.sellerDecisionRule}\n\n` +
        `• **Verified Campus Handover**: ${toolResult.campusHandoverRule}`;
    } else if (msgLower.includes('price') || msgLower.includes('worth') || msgLower.includes('estimate') || msgLower.includes('valuation')) {
      let cat = 'Other';
      if (msgLower.includes('cycle') || msgLower.includes('bicycle')) cat = 'Cycles & Commute';
      if (msgLower.includes('calculator') || msgLower.includes('casio')) cat = 'Electronics & Calculators';
      if (msgLower.includes('chair') || msgLower.includes('cooktop')) cat = 'Hostel & Room';
      if (msgLower.includes('book')) cat = 'Books & Academics';

      toolResult = estimateFairMarketValueTool(message, cat, 'Good');
      responseText = `📊 **Campus Valuation Analysis for "${message}"**:\n\n` +
        `• **Estimated Fair Value**: ${toolResult.estimatedFairMarketValue}\n` +
        `• **Recommended Starting Bid**: ₹${toolResult.suggestedStartingPrice}\n` +
        `• **Category Benchmark**: ${toolResult.valuationGuidance}\n\n` +
        `💡 *Campus Tip: ${toolResult.campusRecommendation}*`;
    } else if (auctionId || msgLower.includes('status') || msgLower.includes('bid')) {
      const targetId = auctionId || 'auc-hero-sprint-26t';
      toolResult = await checkLiveAuctionStatusTool(targetId);
      if (toolResult.error) {
        responseText = `I could not locate auction ID "${targetId}". Would you like me to search active marketplace items?`;
      } else {
        responseText = `🏷️ **Live Auction Status: ${toolResult.title}**\n\n` +
          `• **Leading Price**: ${toolResult.currentPrice} (${toolResult.totalBids} bids placed)\n` +
          `• **Time Remaining**: ${toolResult.remainingTime}\n` +
          `• **Status**: ${toolResult.status}\n` +
          `• **Anti-Snipe Extended**: ${toolResult.antiSnipeActive ? 'Yes (+60s applied)' : 'No'}\n` +
          `• **Handover Location**: ${toolResult.handoverLocation}`;
      }
    } else {
      toolResult = await searchMarketplaceTool(message);
      if (toolResult.length > 0) {
        const items = toolResult.map((i: any) => `• **${i.title}** (${i.category}) - Leading at ${i.currentPrice} • Closes ${i.closesAt}`).join('\n');
        responseText = `🔎 I found ${toolResult.length} active listings matching your query:\n\n${items}\n\nWould you like me to inspect details or fair pricing for any of these?`;
      } else {
        responseText = `Hello! I am your **Campus Auction AI Assistant**. I can assist you with:\n\n` +
          `1. **Search & Discovery**: Finding items currently on auction across hostel halls.\n` +
          `2. **Fair Price Estimation**: Suggesting competitive starting bids and market valuation.\n` +
          `3. **Anti-Sniping & Fair-Play**: Explaining the 30s/60s rules and verified PIN handover.\n` +
          `4. **Live Auction Auditing**: Checking current high bids and time remaining.`;
      }
    }

    return res.json({
      reply: responseText,
      toolData: toolResult,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
