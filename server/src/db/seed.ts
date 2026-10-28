import { getDb, schema } from './index.js';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  const db = await getDb();

  console.log('[Seed] Seeding users...');
  const seedUsers = [
    {
      id: 'usr-rohan-24',
      email: 'rohan.mech@campus.edu',
      name: 'Rohan Sharma',
      studentId: '2021ME10482',
      campus: 'IIT Kharagpur',
      hall: 'Nehru Hall',
      phone: '+91 98765 43210',
      isVerified: true,
      trustScore: 98,
      role: 'student',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
    },
    {
      id: 'usr-ananya-25',
      email: 'ananya.cs@campus.edu',
      name: 'Ananya Patel',
      studentId: '2022CS10214',
      campus: 'IIT Kharagpur',
      hall: 'Sarojini Naidu Hall',
      phone: '+91 98765 43211',
      isVerified: true,
      trustScore: 99,
      role: 'student',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256'
    },
    {
      id: 'usr-vikram-23',
      email: 'vikram.ee@campus.edu',
      name: 'Vikram Das',
      studentId: '2020EE10931',
      campus: 'IIT Kharagpur',
      hall: 'Patel Hall',
      phone: '+91 98765 43212',
      isVerified: true,
      trustScore: 95,
      role: 'student',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256'
    },
    {
      id: 'usr-priya-26',
      email: 'priya.aero@campus.edu',
      name: 'Priya Kumari',
      studentId: '2023AE10018',
      campus: 'IIT Kharagpur',
      hall: 'Mother Teresa Hall',
      phone: '+91 98765 43213',
      isVerified: true,
      trustScore: 97,
      role: 'student',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256'
    },
    {
      id: 'usr-admin-01',
      email: 'admin.auctions@campus.edu',
      name: 'Campus Proctor Verma',
      studentId: 'ADMIN-2024-PROCTOR',
      campus: 'IIT Kharagpur',
      hall: 'Admin Headquarters',
      phone: '+91 98765 43299',
      isVerified: true,
      trustScore: 100,
      role: 'admin',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256'
    }
  ];

  for (const u of seedUsers) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.id, u.id));
    if (existing.length === 0) {
      await db.insert(schema.users).values(u);
    }
  }

  console.log('[Seed] Seeding auctions...');
  const now = new Date();
  
  const seedAuctions = [
    {
      id: 'auc-hero-sprint-26t',
      title: 'Hero Sprint 26T Mountain Bicycle',
      description: 'Matte Black & Cobalt Blue, Front Suspension, 18-Speed Shimano Tourney Drivetrain. Well maintained with dual disc brakes, lubricated chain, and recent Hartex 26x2.10 tires. Includes heavy-duty campus U-lock and LED headlamp.',
      category: 'Cycles & Commute',
      condition: 'Good',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&q=80&w=1200'
      ]),
      startingPrice: 1500,
      currentPrice: 2400,
      minIncrement: 50,
      reservePrice: 2000,
      sellerId: 'usr-rohan-24',
      status: 'ACTIVE',
      startTime: new Date(now.getTime() - 3600000 * 2), // 2h ago
      closesAt: new Date(now.getTime() + 1000 * 60 * 20), // 20 minutes from now (live!)
      antiSnipeTriggered: false,
      extensionsCount: 0,
      handoverLocation: 'Nehru Hall Cycle Shed or Central Library Steps',
      handoverCode: '4821',
      totalBids: 4
    },
    {
      id: 'auc-casio-fx-991ex',
      title: 'Casio fx-991EX ClassWiz Scientific Calculator',
      description: 'Original high-res LCD matrix display, 552 functions including matrix/vector calculus, dual power (solar + battery). Mandatory for semester engineering exams. Includes slide-on hard case and user cheat sheet.',
      category: 'Electronics & Calculators',
      condition: 'Like New',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&q=80&w=1200'
      ]),
      startingPrice: 600,
      currentPrice: 950,
      minIncrement: 50,
      reservePrice: 850,
      sellerId: 'usr-ananya-25',
      status: 'ACTIVE',
      startTime: new Date(now.getTime() - 3600000 * 4),
      closesAt: new Date(now.getTime() + 1000 * 60 * 55),
      antiSnipeTriggered: false,
      extensionsCount: 0,
      handoverLocation: 'Central Library Foyer / Nescafe Counter',
      handoverCode: '1109',
      totalBids: 5
    },
    {
      id: 'auc-oppenheim-signal-bundle',
      title: 'Oppenheim Signals & Systems + Sedra Microelectronics (Hardcover)',
      description: 'Core semester textbooks for ECE/EE branches. Pristine binding, crisp pages with zero highlighter markings. Saves over ₹3,000 compared to new bookstore copies.',
      category: 'Books & Academics',
      condition: 'Good',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200'
      ]),
      startingPrice: 400,
      currentPrice: 650,
      minIncrement: 50,
      reservePrice: 500,
      sellerId: 'usr-vikram-23',
      status: 'ACTIVE',
      startTime: new Date(now.getTime() - 3600000 * 1),
      closesAt: new Date(now.getTime() + 1000 * 60 * 120),
      antiSnipeTriggered: false,
      extensionsCount: 0,
      handoverLocation: 'Department of Electrical Engineering Lobby',
      handoverCode: '3901',
      totalBids: 3
    },
    {
      id: 'auc-featherlite-chair',
      title: 'Featherlite High-Back Ergonomic Hostel Study Chair',
      description: 'Breathable mesh back with adjustable lumbar support, 3D armrests, and smooth nylon casters. Bought in 3rd year, excellent condition for long coding and study sessions.',
      category: 'Hostel & Room',
      condition: 'Like New',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1580481077195-731da03fed74?auto=format&fit=crop&q=80&w=1200'
      ]),
      startingPrice: 1800,
      currentPrice: 2900,
      minIncrement: 100,
      reservePrice: 2500,
      sellerId: 'usr-priya-26',
      status: 'ACTIVE',
      startTime: new Date(now.getTime() - 3600000 * 5),
      closesAt: new Date(now.getTime() + 1000 * 60 * 180),
      antiSnipeTriggered: false,
      extensionsCount: 0,
      handoverLocation: 'Mother Teresa Hall Gate',
      handoverCode: '7721',
      totalBids: 6
    },
    {
      id: 'auc-philips-induction',
      title: 'Philips HD4928 2100W Induction Cooktop + Stainless Steel Pan',
      description: 'Hostel compliant with auto-off timer and flame-free preset Indian menus. Clean surface with no cracks. Tested and verified.',
      category: 'Hostel & Room',
      condition: 'Good',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200'
      ]),
      startingPrice: 900,
      currentPrice: 1400,
      minIncrement: 50,
      reservePrice: 1200,
      sellerId: 'usr-ananya-25',
      status: 'RESERVED', // For demonstrating handover flow!
      startTime: new Date(now.getTime() - 3600000 * 24),
      closesAt: new Date(now.getTime() - 3600000 * 1),
      antiSnipeTriggered: false,
      extensionsCount: 0,
      winnerId: 'usr-vikram-23',
      winningBidId: 'bid-philips-win',
      sellerApprovedAt: new Date(now.getTime() - 1800000),
      handoverLocation: 'Nescafe Kiosk near Sarojini Hall',
      handoverCode: '6219',
      totalBids: 7
    },
    {
      id: 'auc-hercules-hybrid',
      title: 'Hercules Roadeo A50 21-Speed City Hybrid',
      description: 'Alloy frame with double wall rims, Zoom front shocks. Auction closed. Awaiting seller decision.',
      category: 'Cycles & Commute',
      condition: 'Good',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&q=80&w=1200'
      ]),
      startingPrice: 2200,
      currentPrice: 3100,
      minIncrement: 50,
      reservePrice: 2800,
      sellerId: 'usr-vikram-23',
      status: 'PENDING_SELLER_DECISION', // For demonstrating Seller Decisions flow!
      startTime: new Date(now.getTime() - 3600000 * 12),
      closesAt: new Date(now.getTime() - 1800000),
      antiSnipeTriggered: true,
      extensionsCount: 1,
      winnerId: 'usr-ananya-25',
      handoverLocation: 'Patel Hall Main Gate',
      handoverCode: '9034',
      totalBids: 8
    }
  ];

  for (const a of seedAuctions) {
    const existing = await db.select().from(schema.auctions).where(eq(schema.auctions.id, a.id));
    if (existing.length === 0) {
      await db.insert(schema.auctions).values(a);
    }
  }

  console.log('[Seed] Seeding sample bids...');
  const seedBids = [
    { id: 'bid-1', auctionId: 'auc-hero-sprint-26t', bidderId: 'usr-vikram-23', amount: 1500, createdAt: new Date(now.getTime() - 3600000 * 1.5) },
    { id: 'bid-2', auctionId: 'auc-hero-sprint-26t', bidderId: 'usr-priya-26', amount: 1750, createdAt: new Date(now.getTime() - 3600000 * 1.2) },
    { id: 'bid-3', auctionId: 'auc-hero-sprint-26t', bidderId: 'usr-ananya-25', amount: 2100, createdAt: new Date(now.getTime() - 3600000 * 0.8) },
    { id: 'bid-4', auctionId: 'auc-hero-sprint-26t', bidderId: 'usr-vikram-23', amount: 2400, createdAt: new Date(now.getTime() - 3600000 * 0.2) }
  ];

  for (const b of seedBids) {
    const existing = await db.select().from(schema.bids).where(eq(schema.bids.id, b.id));
    if (existing.length === 0) {
      await db.insert(schema.bids).values(b);
    }
  }

  console.log('[Seed] Seeding sample notifications...');
  const seedNotifications = [
    {
      id: 'notif-1',
      userId: 'usr-rohan-24',
      title: 'New Bid Received on Hero Sprint Bicycle',
      message: 'Vikram Das placed a bid of ₹2,400. Your auction has 4 bids now.',
      type: 'OUTBID',
      link: '/auctions/auc-hero-sprint-26t',
      isRead: false
    },
    {
      id: 'notif-2',
      userId: 'usr-ananya-25',
      title: 'You have been outbid!',
      message: 'Vikram Das placed a higher bid of ₹2,400 on Hero Sprint Bicycle.',
      type: 'OUTBID',
      link: '/auctions/auc-hero-sprint-26t',
      isRead: false
    },
    {
      id: 'notif-3',
      userId: 'usr-vikram-23',
      title: 'Seller Decision Required',
      message: 'Hercules Roadeo A50 closed at ₹3,100. Review and approve or reject the final price.',
      type: 'SELLER_DECISION_REQUIRED',
      link: '/seller-decisions',
      isRead: false
    }
  ];

  for (const n of seedNotifications) {
    const existing = await db.select().from(schema.notifications).where(eq(schema.notifications.id, n.id));
    if (existing.length === 0) {
      await db.insert(schema.notifications).values(n);
    }
  }

  console.log('[Seed] Database seeded successfully!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase().then(() => process.exit(0)).catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
