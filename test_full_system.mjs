// Comprehensive system test for Campus Auction Platform
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('   CAMPUS AUCTION SYSTEM INTEGRATION TEST SUITE     ');
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

  // 4. Student Registration
  const testStudentId = `TEST${Date.now().toString().slice(-6)}`;
  const testEmail = `student_${Date.now()}@campus.edu`;
  let registeredUser = null;
  let authToken = null;

  await check('POST /auth/register (New student registration in PostgreSQL)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dev Test Student',
        studentId: testStudentId,
        email: testEmail,
        campus: 'IIT Kharagpur',
        hall: 'Nehru Hall',
        phone: '+91 99887 76655',
        password: 'securePass123',
        role: 'student',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Status ${res.status}`);
    }
    const data = await res.json();
    registeredUser = data.user;
    authToken = data.token;
    if (!registeredUser || !registeredUser.id) throw new Error('Missing user in registration response');
  });

  // 5. Student Login with Password Verification
  await check('POST /auth/login (Verification against hashed password)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: testStudentId,
        password: 'securePass123',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Status ${res.status}`);
    }
    const data = await res.json();
    if (data.user.email !== testEmail) throw new Error('User email does not match');
  });

  // 6. Failed Login Attempt with Wrong Password
  await check('POST /auth/login (Rejects incorrect password with 401)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: testStudentId,
        password: 'WRONG_PASSWORD',
      }),
    });
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized but got ${res.status}`);
  });

  // 7. Get Current User (Auth Middleware)
  await check('GET /auth/me (Protected route JWT validation)', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.user.id !== registeredUser.id) throw new Error('Token does not match registered user');
  });

  // 8. Create Auction Listing as Seller
  let createdAuction = null;
  await check('POST /auctions (Seller creates listing in PostgreSQL)', async () => {
    const res = await fetch(`${BASE_URL}/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: 'Sony WH-1000XM4 Noise Canceling Headphones',
        description: 'Excellent condition ANC headphones with 30-hour battery life, travel case, and 3.5mm audio cable. Used gently in library reading room.',
        category: 'Electronics & Calculators',
        condition: 'Like New',
        startingPrice: 12000,
        minIncrement: 200,
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

  // 9. Buyer Browsing Marketplace & Finding New Listing
  await check('GET /auctions (Buyers marketplace fetches newly listed item)', async () => {
    const res = await fetch(`${BASE_URL}/auctions?category=Electronics+%26+Calculators`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const found = data.auctions.find((a) => a.id === createdAuction.id);
    if (!found) throw new Error('Newly created listing not returned in marketplace feed');
  });

  // 10. Place Authoritative Bid as Another Student
  await check('POST /auctions/:id/bids (Buyer places bid through transactional engine)', async () => {
    const buyerId = testUsers[0].id; // Rohan Sharma
    const res = await fetch(`${BASE_URL}/auctions/${createdAuction.id}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': buyerId,
      },
      body: JSON.stringify({
        amount: 12200,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Status ${res.status}`);
    }
    const data = await res.json();
    const currentPrice = data.auction?.currentPrice || data.bid?.amount || data.newPrice;
    if (currentPrice !== 12200) throw new Error(`Expected current price 12200 but got ${currentPrice}`);
  });

  // 11. Verify Bid Ledger Audit
  await check('GET /auctions/:id (Audit trail contains recorded bid)', async () => {
    const res = await fetch(`${BASE_URL}/auctions/${createdAuction.id}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.auction.currentPrice !== 12200) throw new Error('Auction current price not updated');
    if (data.auction.bids.length !== 1) throw new Error('Bid history audit log missing bid');
  });

  // 12. Submit Question in Q&A
  await check('POST /auctions/:id/qa (Ask question about product)', async () => {
    const res = await fetch(`${BASE_URL}/auctions/${createdAuction.id}/qa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUsers[0].id,
      },
      body: JSON.stringify({
        question: 'Is the original Sony USB-C charging cable and airplane adapter included?',
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.qa || !data.qa.question) throw new Error('Q&A submission failed');
  });

  // 13. AI Assistant Chat
  await check('POST /ai/chat (AI Assistant tool calling & market appraisal)', async () => {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': testUsers[0].id,
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
