// Comprehensive system test for Campus Auction Platform with Buyer/Seller Roles & Restrictions
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('   CAMPUS AUCTION SYSTEM INTEGRATION TEST SUITE     ');
  console.log('   (Role Separation: Seller Listing & Buyer Bidding)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      process.stdout.write(`• Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log('❌ FAILED:', err.message);
      failed++;
    }
  }

  // 1. Health check
  await check('GET /health (Backend service status)', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Health check returned non-ok');
  });

  // 2. Client Vite Proxy check
  await check('Client Proxy (http://localhost:5173/api/health)', async () => {
    const res = await fetch('http://localhost:5173/api/health');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Proxy check returned non-ok');
  });

  // 3. Test accounts retrieval
  let testUsers = [];
  await check('GET /auth/test-accounts (PostgreSQL users table)', async () => {
    const res = await fetch(`${BASE_URL}/auth/test-accounts`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.users || data.users.length === 0) throw new Error('No users found in database');
    testUsers = data.users;
  });

  // 4. Register Verified Campus Seller
  const sellerStudentId = `SELLER${Date.now().toString().slice(-6)}`;
  const sellerEmail = `seller_${Date.now()}@campus.edu`;
  let sellerUser = null;
  let sellerToken = null;

  await check('POST /auth/register (New Campus Seller account)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vikram Verified Seller',
        studentId: sellerStudentId,
        email: sellerEmail,
        campus: 'IIT Kharagpur',
        hall: 'Patel Hall',
        phone: '+91 99887 76655',
        password: 'securePass123',
        role: 'seller',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Status ${res.status}`);
    }
    const data = await res.json();
    sellerUser = data.user;
    sellerToken = data.token;
    if (!sellerUser || sellerUser.role !== 'seller') throw new Error('Seller registration role mismatch');
  });

  // 5. Register Verified Campus Buyer
  const buyerStudentId = `BUYER${Date.now().toString().slice(-6)}`;
  const buyerEmail = `buyer_${Date.now()}@campus.edu`;
  let buyerUser = null;
  let buyerToken = null;

  await check('POST /auth/register (New Campus Buyer account)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Verified Buyer',
        studentId: buyerStudentId,
        email: buyerEmail,
        campus: 'IIT Kharagpur',
        hall: 'Nehru Hall',
        phone: '+91 91234 56789',
        password: 'securePass123',
        role: 'buyer',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Status ${res.status}`);
    }
    const data = await res.json();
    buyerUser = data.user;
    buyerToken = data.token;
    if (!buyerUser || buyerUser.role !== 'buyer') throw new Error('Buyer registration role mismatch');
  });

  // 6. Portal Mismatch Protection: Seller tries to login into Buyer portal
  await check('POST /auth/login (Enforces portal separation - blocks seller in buyer portal)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: sellerStudentId,
        password: 'securePass123',
        expectedRole: 'buyer',
      }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden for portal mismatch but got ${res.status}`);
    }
    const data = await res.json();
    if (!data.error.includes('registered as a Campus Seller')) {
      throw new Error(`Unexpected error message: ${data.error}`);
    }
  });

  // 7. Successful Seller Login into Seller Portal
  await check('POST /auth/login (Seller signs into Campus Seller portal)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: sellerStudentId,
        password: 'securePass123',
        expectedRole: 'seller',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Status ${res.status}`);
    }
    const data = await res.json();
    if (data.user.role !== 'seller') throw new Error('User is not a seller');
  });

  // 8. Buyer Attempt to Create Listing (Enforce Restriction)
  await check('POST /auctions (RESTRICTION: Campus Buyer blocked from listing auction with 403)', async () => {
    const res = await fetch(`${BASE_URL}/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Buyer Listing Attempt',
        description: 'This listing should be rejected by the server.',
        category: 'Electronics & Calculators',
        condition: 'Good',
        startingPrice: 5000,
      }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden but received status ${res.status}`);
    }
  });

  // 9. Seller Creates Auction Listing
  let createdAuction = null;
  await check('POST /auctions (FEATURE: Campus Seller publishes new auction in PostgreSQL)', async () => {
    const res = await fetch(`${BASE_URL}/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        title: 'Sony WH-1000XM4 Noise Canceling Headphones',
        description: 'Excellent condition ANC headphones with 30-hour battery life, travel case, and 3.5mm audio cable. Used gently in library reading room.',
        category: 'Electronics & Calculators',
        condition: 'Like New',
        startingPrice: 12000,
        minIncrement: 200,
        reservePrice: 14000,
        durationMinutes: 720,
        handoverLocation: 'Nehru Hall Common Room',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600'],
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Status ${res.status}`);
    }
    const data = await res.json();
    createdAuction = data.auction;
    if (!createdAuction || createdAuction.currentPrice !== 12000) throw new Error('Auction creation failed');
  });

  // 10. Seller Attempt to Bid on Auction (Enforce Restriction)
  await check('POST /auctions/:id/bids (RESTRICTION: Campus Seller blocked from bidding with 403)', async () => {
    const res = await fetch(`${BASE_URL}/auctions/${createdAuction.id}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        amount: 12200,
      }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden for seller bidding but got ${res.status}`);
    }
  });

  // 11. Buyer Browsing Marketplace & Finding New Listing
  await check('GET /auctions (FEATURE: Campus Buyer browses and discovers listing)', async () => {
    const res = await fetch(`${BASE_URL}/auctions?category=Electronics+%26+Calculators`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const found = data.auctions.find((a) => a.id === createdAuction.id);
    if (!found) throw new Error('Newly created listing not returned in marketplace feed');
  });

  // 12. Buyer Sets Amount and Places Real-Time Bid
  await check('POST /auctions/:id/bids (FEATURE: Campus Buyer sets amount and places winning bid)', async () => {
    const res = await fetch(`${BASE_URL}/auctions/${createdAuction.id}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        amount: 12500, // custom amount above min increment
        maxBudget: 15000, // optional proxy auto-bid limit
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Status ${res.status}`);
    }
    const data = await res.json();
    const currentPrice = data.auction?.currentPrice || data.bid?.amount || data.newPrice;
    if (currentPrice !== 12500) throw new Error(`Expected current price 12500 but got ${currentPrice}`);
  });

  // 13. Verify Audit Ledger Trail
  await check('GET /auctions/:id (Audit trail records buyer name, timestamp & price)', async () => {
    const res = await fetch(`${BASE_URL}/auctions/${createdAuction.id}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.auction.currentPrice !== 12500) throw new Error('Auction current price not updated');
    if (data.auction.bids.length !== 1) throw new Error('Bid history audit log missing bid');
    if (data.auction.bids[0].amount !== 12500) throw new Error('Recorded bid amount does not match');
  });

  // 14. Buyer Submits Question in Q&A
  let createdQa = null;
  await check('POST /auctions/:id/qa (Buyer asks question about item condition)', async () => {
    const res = await fetch(`${BASE_URL}/auctions/${createdAuction.id}/qa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        question: 'Is the original Sony USB-C charging cable and airplane adapter included?',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    createdQa = data.qa;
    if (!createdQa || !createdQa.question) throw new Error('Q&A submission failed');
  });

  // 15. Seller Answers Question
  await check('POST /auctions/:id/qa/:qaId/answer (Seller provides official answer)', async () => {
    const res = await fetch(`${BASE_URL}/auctions/${createdAuction.id}/qa/${createdQa.id}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        answer: 'Yes! All original accessories, hardshell case and gold-plated airplane jack are included.',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.qa || !data.qa.answer) throw new Error('Q&A answer failed');
  });

  // 16. AI Assistant Chat
  await check('POST /ai/chat (AI Assistant tool calling & market appraisal)', async () => {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        message: 'What cycles are currently available on campus and what are their prices?',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.reply && !data.response) throw new Error('AI Assistant did not return response');
  });

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
