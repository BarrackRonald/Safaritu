// prisma/seed.ts
// Run with: npx prisma db seed
// Reset & reseed: npx prisma migrate reset

import {
  PrismaClient,
  Plan,
  TourStatus,
  Difficulty,
  DepartureStatus,
  BookingStatus,
  PaymentStatus,
  PaymentProvider,
  LeadStatus,
  UserRole,
} from '@prisma/client';

// Use DIRECT_URL for seeding to bypass PgBouncer (avoids P1017 connection drops)
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } },
  log: ['warn', 'error'],
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function generateReference(prefix = 'ST'): string {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${random}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DESTINATIONS
// ─────────────────────────────────────────────────────────────────────────────

const DESTINATIONS = [
  {
    name: 'Maasai Mara',
    slug: 'maasai-mara',
    country: 'Kenya',
    emoji: '🦁',
    description:
      "Home to the Great Migration and one of Africa's most iconic wildlife reserves. The vast grasslands teem with lions, elephants, cheetahs, and millions of wildebeest.",
    imageUrl:
      'https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=800',
    featured: true,
    sortOrder: 1,
  },
  {
    name: 'Amboseli',
    slug: 'amboseli',
    country: 'Kenya',
    emoji: '🐘',
    description:
      'Famous for its large elephant herds and stunning views of Mount Kilimanjaro. One of the best places in Africa to observe free-ranging elephants up close.',
    imageUrl:
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
    featured: true,
    sortOrder: 2,
  },
  {
    name: 'Serengeti',
    slug: 'serengeti',
    country: 'Tanzania',
    emoji: '🌅',
    description:
      "Tanzania's most famous national park. The endless plains host the world's largest land migration and an extraordinary concentration of predators.",
    imageUrl:
      'https://images.unsplash.com/photo-1535941339077-2dd1c7963098?w=800',
    featured: true,
    sortOrder: 3,
  },
  {
    name: 'Tsavo',
    slug: 'tsavo',
    country: 'Kenya',
    emoji: '🦏',
    description:
      "Kenya's largest national park, split into East and West. Known for its red elephants, black rhinos, and dramatic lava flows.",
    imageUrl:
      'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800',
    featured: true,
    sortOrder: 4,
  },
  {
    name: 'Samburu',
    slug: 'samburu',
    country: 'Kenya',
    emoji: '🦒',
    description:
      "A remote and rugged wilderness in northern Kenya. Home to rare species found nowhere else -- Grevy's zebra, reticulated giraffe, and Beisa oryx.",
    imageUrl:
      'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800',
    featured: true,
    sortOrder: 5,
  },
  {
    name: 'Ngorongoro',
    slug: 'ngorongoro',
    country: 'Tanzania',
    emoji: '🌋',
    description:
      "A UNESCO World Heritage Site and the world's largest intact volcanic caldera. The crater floor is a natural enclosure for an incredible density of wildlife.",
    imageUrl:
      'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800',
    featured: true,
    sortOrder: 6,
  },
  {
    name: 'Lake Nakuru',
    slug: 'lake-nakuru',
    country: 'Kenya',
    emoji: '🦩',
    description:
      'Famous for its flamingo-lined shores and a sanctuary for both black and white rhinos. A compact park that punches well above its weight.',
    imageUrl: null,
    featured: false,
    sortOrder: 7,
  },
  {
    name: 'Bwindi',
    slug: 'bwindi',
    country: 'Uganda',
    emoji: '🦍',
    description:
      "The Impenetrable Forest -- home to nearly half the world's remaining mountain gorillas. A trekking experience unlike any other.",
    imageUrl: null,
    featured: false,
    sortOrder: 8,
  },
  {
    name: 'Zanzibar',
    slug: 'zanzibar',
    country: 'Tanzania',
    emoji: '🏝️',
    description:
      'The perfect post-safari beach extension. Spice-scented Stone Town, crystal-clear Indian Ocean waters, and pristine white sand beaches.',
    imageUrl: null,
    featured: false,
    sortOrder: 9,
  },
  {
    name: 'Laikipia',
    slug: 'laikipia',
    country: 'Kenya',
    emoji: '🐆',
    description:
      'A conservancy mosaic north of Mount Kenya. One of Africa\'s finest destinations for endangered species including African wild dogs and black rhinos.',
    imageUrl: null,
    featured: false,
    sortOrder: 10,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// OPERATORS
// ─────────────────────────────────────────────────────────────────────────────

const OPERATORS = [
  {
    ownerName: 'Mofat Onyango',
    companyName: 'Mofire Adventures',
    slug: 'mofire-adventures',
    email: 'info@mofireadventures.com',
    phone: '+254712345678',
    website: 'https://mofireadventures.com',
    bio: 'Authentic Kenyan safari experiences tailored for every traveller.',
    plan: Plan.PRO,
  },
  {
    ownerName: 'Ronald Barrack',
    companyName: 'Ideal Adventures',
    slug: 'ideal-adventures',
    email: 'info@idealadventures.co.ke',
    phone: '+254723456789',
    website: 'https://idealadventures.co.ke',
    bio: 'Exceptional East African tours with a focus on culture and community.',
    plan: Plan.GROWTH,
  },
  {
    ownerName: 'Susan Wahome',
    companyName: 'Susafaris Adventures',
    slug: 'susafaris-adventures',
    email: 'info@susafaris.com',
    phone: '+254734567890',
    website: 'https://susafaris.com',
    bio: 'Luxury safari experiences crafted for the discerning explorer.',
    plan: Plan.STARTER,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TOUR TEMPLATES (per operator)
// ─────────────────────────────────────────────────────────────────────────────

// Each operator gets a distinct set of tours linked to seeded destinations.
function getTourTemplates(operatorSlug: string) {
  const byOperator: Record<
    string,
    {
      title: string;
      slug: string;
      description: string;
      location: string;
      destinationSlug: string | null;
      durationDays: number;
      durationNights: number;
      pricePerPerson: number;
      difficulty: Difficulty;
      isFeatured: boolean;
      isTopPick: boolean;
      topPickScore: number;
      highlights: string[];
      includes: string[];
      excludes: string[];
      imageUrls: string[];
    }[]
  > = {
    'mofire-adventures': [
      {
        title: '3-Day Maasai Mara Safari',
        slug: '3-day-maasai-mara-safari',
        description:
          'Explore the world-famous Maasai Mara and witness the Big Five in their natural habitat.',
        location: 'Maasai Mara National Reserve',
        destinationSlug: 'maasai-mara',
        durationDays: 3,
        durationNights: 2,
        pricePerPerson: 45000,
        difficulty: Difficulty.EASY,
        isFeatured: true,
        isTopPick: true,
        topPickScore: 95,
        highlights: [
          'Big Five game drives',
          'Maasai village cultural visit',
          'Hot air balloon option',
        ],
        includes: [
          'Transport in 4x4 Land Cruiser',
          'Park entry fees',
          'Full-board accommodation',
          'Professional guide',
        ],
        excludes: ['Flights', 'Visa fees', 'Travel insurance', 'Tips & gratuities'],
        imageUrls: [
          'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e',
          'https://images.unsplash.com/photo-1516426122078-c23e76319801',
        ],
      },
      {
        title: '5-Day Amboseli & Tsavo Adventure',
        slug: '5-day-amboseli-tsavo-adventure',
        description:
          'Discover elephant herds beneath Mt. Kilimanjaro and the red elephants of Tsavo East.',
        location: 'Amboseli & Tsavo',
        destinationSlug: 'amboseli',
        durationDays: 5,
        durationNights: 4,
        pricePerPerson: 98000,
        difficulty: Difficulty.MODERATE,
        isFeatured: true,
        isTopPick: false,
        topPickScore: 78,
        highlights: [
          'Elephant herds at Amboseli',
          'Kilimanjaro views at sunrise',
          'Red elephants of Tsavo',
        ],
        includes: [
          '4x4 Land Cruiser transport',
          'Park fees',
          'Full-board accommodation',
          'Airport transfers',
        ],
        excludes: ['International flights', 'Visa', 'Personal items', 'Tips'],
        imageUrls: [
          'https://images.unsplash.com/photo-1516426122078-c23e76319801',
          'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa',
        ],
      },
      {
        title: '7-Day Kenya Highlights Safari',
        slug: '7-day-kenya-highlights-safari',
        description:
          'A complete Kenyan circuit covering Samburu, Lake Nakuru, and the Maasai Mara.',
        location: 'Kenya Circuit',
        destinationSlug: 'samburu',
        durationDays: 7,
        durationNights: 6,
        pricePerPerson: 165000,
        difficulty: Difficulty.MODERATE,
        isFeatured: false,
        isTopPick: true,
        topPickScore: 88,
        highlights: [
          'Rare northern species in Samburu',
          'Flamingos at Lake Nakuru',
          'Great wildebeest migration',
        ],
        includes: [
          'All road transport',
          'Park fees',
          'Luxury lodge accommodation',
          'All meals',
          'Experienced naturalist guide',
        ],
        excludes: ['Flights', 'Visa', 'Insurance', 'Alcohol', 'Tips'],
        imageUrls: [
          'https://images.unsplash.com/photo-1474511320723-9a56873867b5',
          'https://images.unsplash.com/photo-1547470810-dc1eac37d174',
        ],
      },
    ],

    'ideal-adventures': [
      {
        title: '4-Day Serengeti Migration Safari',
        slug: '4-day-serengeti-migration-safari',
        description:
          "Chase the Great Migration across the Serengeti's legendary golden plains.",
        location: 'Serengeti National Park, Tanzania',
        destinationSlug: 'serengeti',
        durationDays: 4,
        durationNights: 3,
        pricePerPerson: 120000,
        difficulty: Difficulty.EASY,
        isFeatured: true,
        isTopPick: true,
        topPickScore: 92,
        highlights: [
          'Witness the Great Migration river crossings',
          'Big cat sightings',
          'Fly-in option from Nairobi or Arusha',
        ],
        includes: [
          'Shared 4x4 safari vehicle',
          'Serengeti park fees',
          'Tented camp accommodation',
          'Full board',
        ],
        excludes: ['Flights to Tanzania', 'Visa', 'Travel insurance', 'Laundry'],
        imageUrls: [
          'https://images.unsplash.com/photo-1535941339077-2dd1c7963098',
          'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5',
        ],
      },
      {
        title: '3-Day Ngorongoro Crater Experience',
        slug: '3-day-ngorongoro-crater-experience',
        description:
          "Descend into the world's greatest natural amphitheatre, alive with Africa's densest wildlife population.",
        location: 'Ngorongoro Conservation Area, Tanzania',
        destinationSlug: 'ngorongoro',
        durationDays: 3,
        durationNights: 2,
        pricePerPerson: 85000,
        difficulty: Difficulty.EASY,
        isFeatured: true,
        isTopPick: false,
        topPickScore: 82,
        highlights: [
          'Full-day crater floor game drive',
          'Rhino, lion, and flamingo sightings',
          'UNESCO World Heritage Site',
        ],
        includes: [
          '4x4 Land Cruiser',
          'Ngorongoro crater fees',
          'Lodge accommodation on crater rim',
          'Breakfast & lunch',
        ],
        excludes: ['Flights', 'Dinners', 'Visa', 'Tips'],
        imageUrls: [
          'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5',
          'https://images.unsplash.com/photo-1535941339077-2dd1c7963098',
        ],
      },
      {
        title: '6-Day Tanzania Grand Circuit',
        slug: '6-day-tanzania-grand-circuit',
        description:
          'The ultimate Tanzania wildlife experience combining the Serengeti and Ngorongoro Crater with Tarangire.',
        location: 'Northern Tanzania Circuit',
        destinationSlug: 'serengeti',
        durationDays: 6,
        durationNights: 5,
        pricePerPerson: 210000,
        difficulty: Difficulty.MODERATE,
        isFeatured: false,
        isTopPick: true,
        topPickScore: 90,
        highlights: [
          'Tarangire baobab and elephant corridor',
          'Ngorongoro full-day crater drive',
          'Multi-day Serengeti immersion',
        ],
        includes: [
          'Private 4x4 vehicle',
          'All park and conservation fees',
          'Mixed camp & lodge accommodation',
          'All meals',
          'English/Swahili speaking guide',
        ],
        excludes: ['International flights', 'Visa', 'Alcohol', 'Tips'],
        imageUrls: [
          'https://images.unsplash.com/photo-1535941339077-2dd1c7963098',
          'https://images.unsplash.com/photo-1474511320723-9a56873867b5',
        ],
      },
    ],

    'susafaris-adventures': [
      {
        title: '5-Day Luxury Maasai Mara Experience',
        slug: '5-day-luxury-maasai-mara-experience',
        description:
          'An exclusive private Maasai Mara safari with premium bush accommodations and dedicated guide.',
        location: 'Maasai Mara Conservancies',
        destinationSlug: 'maasai-mara',
        durationDays: 5,
        durationNights: 4,
        pricePerPerson: 185000,
        difficulty: Difficulty.EASY,
        isFeatured: true,
        isTopPick: true,
        topPickScore: 97,
        highlights: [
          'Private conservancy access (no crowds)',
          'Night game drives',
          'Sundowner bush dinners',
          'Bush spa treatments',
        ],
        includes: [
          'Private Land Cruiser & guide',
          'Luxury tented camp -- full board',
          'All conservancy fees',
          'Bush breakfast & sundowners',
          'Laundry service',
        ],
        excludes: ['Flights', 'Visa', 'Travel insurance', 'Champagne & premium spirits'],
        imageUrls: [
          'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e',
          'https://images.unsplash.com/photo-1474511320723-9a56873867b5',
        ],
      },
      {
        title: '4-Day Laikipia Conservancy Safari',
        slug: '4-day-laikipia-conservancy-safari',
        description:
          'Track endangered black rhinos and African wild dogs on foot and by vehicle in the Laikipia plateau.',
        location: 'Laikipia Plateau, Kenya',
        destinationSlug: 'laikipia',
        durationDays: 4,
        durationNights: 3,
        pricePerPerson: 135000,
        difficulty: Difficulty.MODERATE,
        isFeatured: true,
        isTopPick: false,
        topPickScore: 83,
        highlights: [
          'Walking safaris with armed ranger',
          'African wild dog tracking',
          'Black rhino sightings',
          'Community conservancy visit',
        ],
        includes: [
          'Private vehicle & naturalist guide',
          'Conservancy fees',
          'Luxury eco-lodge -- full board',
          'Walking safari equipment',
        ],
        excludes: ['Flights', 'Visa', 'Tips', 'Personal gear'],
        imageUrls: [
          'https://images.unsplash.com/photo-1474511320723-9a56873867b5',
          'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e',
        ],
      },
      {
        title: '8-Day Kenya & Zanzibar Luxury Combo',
        slug: '8-day-kenya-zanzibar-luxury-combo',
        description:
          'The perfect blend of Kenyan safari and Zanzibar beach escape, all handled in seamless luxury.',
        location: 'Maasai Mara & Zanzibar',
        destinationSlug: 'zanzibar',
        durationDays: 8,
        durationNights: 7,
        pricePerPerson: 290000,
        difficulty: Difficulty.EASY,
        isFeatured: false,
        isTopPick: true,
        topPickScore: 93,
        highlights: [
          '4 nights Maasai Mara private camp',
          '3 nights Zanzibar beach villa',
          'Spice tour in Stone Town',
          'Snorkelling at Mnemba Atoll',
        ],
        includes: [
          'All internal flights',
          'Private safari vehicle',
          'Luxury accommodation throughout',
          'All meals on safari; breakfast at beach',
          'Airport & boat transfers',
        ],
        excludes: [
          'International flights',
          'Visa',
          'Travel insurance',
          'Diving certification costs',
        ],
        imageUrls: [
          'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e',
          'https://images.unsplash.com/photo-1516426122078-c23e76319801',
        ],
      },
    ],
  };

  return byOperator[operatorSlug] ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER DATA (per operator)
// ─────────────────────────────────────────────────────────────────────────────

function getCustomerData(slug: string) {
  return [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: `john@${slug}.com`,
      country: 'United Kingdom',
      nationality: 'British',
      phone: '+447700900001',
      tags: ['vip', 'repeat'],
      leadStatus: LeadStatus.VIP,
      source: 'referral',
      notes: 'Prefers window seats and vegetarian meals.',
    },
    {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: `alice@${slug}.com`,
      country: 'United States',
      nationality: 'American',
      phone: '+12025550101',
      tags: ['lead', 'newsletter'],
      leadStatus: LeadStatus.PROSPECT,
      source: 'website',
      notes: 'Interested in honeymoon packages.',
    },
    {
      firstName: 'David',
      lastName: 'Mwangi',
      email: `david@${slug}.com`,
      country: 'Kenya',
      nationality: 'Kenyan',
      phone: '+254711000001',
      tags: ['customer', 'repeat'],
      leadStatus: LeadStatus.CUSTOMER,
      source: 'direct',
      notes: 'Local corporate client. Repeat bookings.',
    },
    {
      firstName: 'Sophie',
      lastName: 'Dupont',
      email: `sophie@${slug}.com`,
      country: 'France',
      nationality: 'French',
      phone: '+33612345678',
      tags: ['lead'],
      leadStatus: LeadStatus.LEAD,
      source: 'instagram',
      notes: null,
    },
    {
      firstName: 'Hiroshi',
      lastName: 'Tanaka',
      email: `hiroshi@${slug}.com`,
      country: 'Japan',
      nationality: 'Japanese',
      phone: '+819012345678',
      tags: ['customer', 'photography'],
      leadStatus: LeadStatus.CUSTOMER,
      source: 'travel-fair',
      notes: 'Wildlife photographer. Needs photography-friendly vehicle.',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED ONE OPERATOR
// ─────────────────────────────────────────────────────────────────────────────

async function seedOperator(
  data: (typeof OPERATORS)[number],
  destinationMap: Record<string, string>,
) {
  // Operator
  const operator = await prisma.operator.upsert({
    where: { email: data.email },
    update: {
      name: data.companyName,
      slug: data.slug,
      phone: data.phone,
      website: data.website,
      bio: data.bio,
      plan: data.plan,
    },
    create: {
      name: data.companyName,
      slug: data.slug,
      email: data.email,
      phone: data.phone,
      website: data.website,
      bio: data.bio,
      plan: data.plan,
    },
  });

  // Subscription
  await prisma.subscription.upsert({
    where: { operatorId: operator.id },
    update: {},
    create: {
      operatorId: operator.id,
      plan: data.plan,
      commissionRate:
        data.plan === Plan.PRO ? 0.03 : data.plan === Plan.GROWTH ? 0.04 : 0.05,
      trialEndsAt: addDays(new Date(), 14),
      currentPeriodEnd: addDays(new Date(), 30),
    },
  });

  // Operator users
  const userRoles = [UserRole.OWNER, UserRole.MANAGER, UserRole.GUIDE];
  for (const role of userRoles) {
    const supabaseId = `${data.slug}-${role.toLowerCase()}`;
    await prisma.operatorUser.upsert({
      where: { supabaseId },
      update: { operatorId: operator.id, role },
      create: { operatorId: operator.id, supabaseId, role },
    });
  }

  // Customers
  const customerData = getCustomerData(data.slug);
  const customers: { id: string }[] = [];

  for (const c of customerData) {
    const customer = await prisma.customer.upsert({
      where: { operatorId_email: { operatorId: operator.id, email: c.email } },
      update: {},
      create: {
        operatorId: operator.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        country: c.country,
        nationality: c.nationality,
        tags: c.tags,
        leadStatus: c.leadStatus,
        source: c.source,
        notes: c.notes,
      },
    });
    customers.push(customer);
  }

  // Tours
  const tourTemplates = getTourTemplates(data.slug);

  for (const t of tourTemplates) {
    const destinationId = t.destinationSlug
      ? (destinationMap[t.destinationSlug] ?? null)
      : null;

    const tour = await prisma.tour.upsert({
      where: { operatorId_slug: { operatorId: operator.id, slug: t.slug } },
      update: {},
      create: {
        operatorId: operator.id,
        destinationId,
        title: t.title,
        slug: t.slug,
        description: t.description,
        highlights: t.highlights,
        includes: t.includes,
        excludes: t.excludes,
        durationDays: t.durationDays,
        durationNights: t.durationNights,
        difficulty: t.difficulty,
        maxCapacity: 8,
        minGroupSize: 1,
        pricePerPerson: t.pricePerPerson,
        currency: 'KES',
        coverImageUrl: t.imageUrls[0] ?? null,
        imageUrls: t.imageUrls,
        location: t.location,
        country: t.destinationSlug === 'serengeti' || t.destinationSlug === 'ngorongoro'
          ? 'Tanzania'
          : t.destinationSlug === 'bwindi'
          ? 'Uganda'
          : 'Kenya',
        isFeatured: t.isFeatured,
        isTopPick: t.isTopPick,
        topPickScore: t.topPickScore,
        status: TourStatus.PUBLISHED,
      },
    });

    // Itinerary days — use createMany (single query, no upsert loop)
    // Delete existing days first so createMany is idempotent on re-runs
    await prisma.itineraryDay.deleteMany({ where: { tourId: tour.id } });
    await prisma.itineraryDay.createMany({
      data: Array.from({ length: t.durationDays }, (_, idx) => {
        const day = idx + 1;
        const isFirst = day === 1;
        const isLast = day === t.durationDays;
        return {
          tourId: tour.id,
          dayNumber: day,
          title: isFirst
            ? 'Arrival & Orientation'
            : isLast
            ? 'Departure Day'
            : `Day ${day} - Wildlife & Exploration`,
          description: isFirst
            ? 'Arrive at your lodge, meet your guide, and enjoy an evening game drive.'
            : isLast
            ? 'Final morning game drive, then transfer to the airstrip or road departure point.'
            : 'Full-day game drives covering diverse habitats. Look out for predators, birds, and the Big Five.',
          accommodation: isLast ? null : `${t.location} Safari Lodge`,
          mealsIncluded: isFirst ? ['dinner'] : isLast ? ['breakfast'] : ['breakfast', 'lunch', 'dinner'],
          activities: isFirst
            ? ['Briefing', 'Evening game drive', 'Welcome dinner']
            : isLast
            ? ['Morning game drive', 'Breakfast', 'Transfer']
            : ['Morning game drive', 'Bush lunch', 'Afternoon game drive', 'Sundowner'],
        };
      }),
    });

    // Delete in FK order: payments -> bookings -> departures
    const existingDepartures = await prisma.departure.findMany({
      where: { tourId: tour.id },
      select: { id: true },
    });
    const departureIds = existingDepartures.map((d) => d.id);

    if (departureIds.length > 0) {
      const existingBookings = await prisma.booking.findMany({
        where: { departureId: { in: departureIds } },
        select: { id: true },
      });
      const bookingIds = existingBookings.map((b) => b.id);

      if (bookingIds.length > 0) {
        await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
        await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
      }

      await prisma.departure.deleteMany({ where: { id: { in: departureIds } } });
    }

    // 4 departures per tour: 2 available, 1 full, 1 cancelled
    const departureStatuses: DepartureStatus[] = [
      DepartureStatus.AVAILABLE,
      DepartureStatus.AVAILABLE,
      DepartureStatus.FULL,
      DepartureStatus.CANCELLED,
    ];

    for (let i = 0; i < 4; i++) {
      const startDate = addDays(new Date(), (i + 1) * 30);
      const endDate = addDays(startDate, t.durationDays - 1);
      const status = departureStatuses[i];
      const bookedCount = status === DepartureStatus.FULL ? 8 : i;

      const departure = await prisma.departure.create({
        data: {
          tourId: tour.id,
          startDate,
          endDate,
          capacity: 8,
          bookedCount,
          priceOverride: i === 1 ? t.pricePerPerson - 5000 : undefined,
          status,
          notes:
            i === 1
              ? 'Early-bird discount applied.'
              : i === 3
              ? 'Cancelled due to low bookings.'
              : null,
        },
      });

      // Create bookings only for non-cancelled departures
      if (status !== DepartureStatus.CANCELLED && customers.length > 0) {
        const customer = customers[i % customers.length];
        const partySize = i === 0 ? 2 : 1;
        const total = t.pricePerPerson * partySize;
        const deposit = Math.round(total * 0.3);
        const isFullyPaid = i === 0;

        const booking = await prisma.booking.create({
          data: {
            reference: generateReference(),
            operatorId: operator.id,
            tourId: tour.id,
            departureId: departure.id,
            customerId: customer.id,
            partySize,
            totalAmount: total,
            depositAmount: deposit,
            balanceDue: isFullyPaid ? 0 : total - deposit,
            currency: 'KES',
            commissionRate:
              data.plan === Plan.PRO ? 0.03 : data.plan === Plan.GROWTH ? 0.04 : 0.05,
            commissionAmount: Math.round(
              total *
                (data.plan === Plan.PRO ? 0.03 : data.plan === Plan.GROWTH ? 0.04 : 0.05),
            ),
            paymentStatus: isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
            bookingStatus:
              status === DepartureStatus.FULL
                ? BookingStatus.CONFIRMED
                : BookingStatus.CONFIRMED,
            specialRequests:
              i === 0 ? 'Window seat and vegetarian meals requested.' : null,
            internalNotes: i === 1 ? 'Early-bird rate applied at booking.' : null,
          },
        });

        // Payment record
        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            amount: isFullyPaid ? total : deposit,
            currency: 'KES',
            provider: i === 0 ? PaymentProvider.STRIPE : PaymentProvider.MPESA,
            providerReference:
              i === 0
                ? `pi_${Math.random().toString(36).substring(2, 12)}`
                : `QH${Math.floor(Math.random() * 10000000)}`,
            status: isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
            metadata: {
              source: i === 0 ? 'Stripe Checkout' : 'M-Pesa STK Push',
            },
            paidAt: new Date(),
          },
        });

        // Add a second partial payment for deposit-only bookings
        if (!isFullyPaid && i === 1) {
          await prisma.payment.create({
            data: {
              bookingId: booking.id,
              amount: deposit,
              currency: 'KES',
              provider: PaymentProvider.MPESA,
              providerReference: `QH${Math.floor(Math.random() * 10000000)}`,
              status: PaymentStatus.PARTIAL,
              metadata: { source: 'M-Pesa manual top-up' },
              paidAt: addDays(new Date(), -5),
            },
          });
        }
      }
    }
  }

  console.log(`  ✅ ${operator.name} (${data.plan})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting seed...\n');

  // 1. Seed destinations first
  console.log('📍 Seeding destinations...');
  const destinationMap: Record<string, string> = {};

  for (const dest of DESTINATIONS) {
    const d = await prisma.destination.upsert({
      where: { slug: dest.slug },
      update: dest,
      create: dest,
    });
    destinationMap[dest.slug] = d.id;
    console.log(`  ✓ ${dest.name} (${dest.country})`);
  }

  // 2. Seed operators (with tours, customers, bookings, payments)
  console.log('\n🏢 Seeding operators...');
  for (const operator of OPERATORS) {
    await seedOperator(operator, destinationMap);
    // Brief pause between operators to avoid overwhelming the connection pool
    await sleep(500);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Destinations : ${DESTINATIONS.length}`);
  console.log(`   Operators    : ${OPERATORS.length}`);
  console.log(`   Users        : ${OPERATORS.length * 3} (Owner + Manager + Guide each)`);
  console.log(`   Customers    : ${OPERATORS.length * 5} (5 per operator)`);
  console.log(`   Tours        : ${OPERATORS.length * 3} (3 per operator)`);
  console.log(`   Departures   : ${OPERATORS.length * 3 * 4} (4 per tour)`);
  console.log(`   Bookings     : ~${OPERATORS.length * 3 * 3} (3 bookable departures per tour)`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/*
===============================================================================
HOW TO RUN
===============================================================================

1. Install dependencies
   npm install

2. Generate Prisma client
   npx prisma generate

3. Run migrations
   npx prisma migrate dev --name init

4. Seed database
   npx prisma db seed

5. (Optional) Reset and reseed
   npx prisma migrate reset

6. View data in browser
   npx prisma studio

===============================================================================
PACKAGE.JSON -- add this section
===============================================================================

{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}

If tsx is not installed:
  npm install -D tsx

===============================================================================
SEED SUMMARY
===============================================================================

Creates:
  10  Destinations (Kenya, Tanzania, Uganda)
   3  Operators    (PRO / GROWTH / STARTER)
   9  OperatorUsers (Owner + Manager + Guide per operator)
   3  Subscriptions (one per operator, with commissionRate by plan)
  15  Customers    (5 per operator, varied lead statuses)
   9  Tours        (3 per operator, linked to destinations)
  ~54  ItineraryDays (proportional to tour duration)
  36  Departures   (4 per tour: 2 available, 1 full, 1 cancelled)
 ~27  Bookings     (3 bookable departures per tour)
 ~30  Payments     (mix of Stripe & M-Pesa, some with 2 payments)

===============================================================================
*/