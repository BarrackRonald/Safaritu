// prisma/seed-destinations.ts
// Run with: npx ts-node prisma/seed-destinations.ts
// Or add to your package.json scripts:
//   "seed:destinations": "ts-node prisma/seed-destinations.ts"
//
// Seeds the curated destination list. Safe to run multiple times (upserts).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DESTINATIONS = [
  {
    name:        "Maasai Mara",
    slug:        "maasai-mara",
    country:     "Kenya",
    emoji:       "🦁",
    description: "Home to the Great Migration and one of Africa's most iconic wildlife reserves. The vast grasslands teem with lions, elephants, cheetahs, and millions of wildebeest.",
    imageUrl:    "https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=800",
    featured:    true,
    sortOrder:   1,
  },
  {
    name:        "Amboseli",
    slug:        "amboseli",
    country:     "Kenya",
    emoji:       "🐘",
    description: "Famous for its large elephant herds and stunning views of Mount Kilimanjaro. One of the best places in Africa to observe free-ranging elephants up close.",
    imageUrl:    "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800",
    featured:    true,
    sortOrder:   2,
  },
  {
    name:        "Serengeti",
    slug:        "serengeti",
    country:     "Tanzania",
    emoji:       "🌅",
    description: "Tanzania's most famous national park. The endless plains host the world's largest land migration and an extraordinary concentration of predators.",
    imageUrl:    "https://images.unsplash.com/photo-1535941339077-2dd1c7963098?w=800",
    featured:    true,
    sortOrder:   3,
  },
  {
    name:        "Tsavo",
    slug:        "tsavo",
    country:     "Kenya",
    emoji:       "🦏",
    description: "Kenya's largest national park, split into East and West. Known for its red elephants, black rhinos, and dramatic lava flows.",
    imageUrl:    "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800",
    featured:    true,
    sortOrder:   4,
  },
  {
    name:        "Samburu",
    slug:        "samburu",
    country:     "Kenya",
    emoji:       "🦒",
    description: "A remote and rugged wilderness in northern Kenya. Home to rare species found nowhere else — Grevy's zebra, reticulated giraffe, and Beisa oryx.",
    imageUrl:    "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800",
    featured:    true,
    sortOrder:   5,
  },
  {
    name:        "Ngorongoro",
    slug:        "ngorongoro",
    country:     "Tanzania",
    emoji:       "🌋",
    description: "A UNESCO World Heritage Site and the world's largest intact volcanic caldera. The crater floor is a natural enclosure for an incredible density of wildlife.",
    imageUrl:    "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800",
    featured:    true,
    sortOrder:   6,
  },
  {
    name:        "Lake Nakuru",
    slug:        "lake-nakuru",
    country:     "Kenya",
    emoji:       "🦩",
    description: "Famous for its flamingo-lined shores and a sanctuary for both black and white rhinos. A compact park that punches well above its weight.",
    imageUrl:    null,
    featured:    false,
    sortOrder:   7,
  },
  {
    name:        "Bwindi",
    slug:        "bwindi",
    country:     "Uganda",
    emoji:       "🦍",
    description: "The Impenetrable Forest — home to nearly half the world's remaining mountain gorillas. A trekking experience unlike any other.",
    imageUrl:    null,
    featured:    false,
    sortOrder:   8,
  },
  {
    name:        "Zanzibar",
    slug:        "zanzibar",
    country:     "Tanzania",
    emoji:       "🏝️",
    description: "The perfect post-safari beach extension. Spice-scented Stone Town, crystal-clear Indian Ocean waters, and pristine white sand beaches.",
    imageUrl:    null,
    featured:    false,
    sortOrder:   9,
  },
  {
    name:        "Laikipia",
    slug:        "laikipia",
    country:     "Kenya",
    emoji:       "🐆",
    description: "A conservancy mosaic north of Mount Kenya. One of Africa's finest destinations for endangered species including African wild dogs and black rhinos.",
    imageUrl:    null,
    featured:    false,
    sortOrder:   10,
  },
];

async function main() {
  console.log("Seeding destinations...");

  for (const dest of DESTINATIONS) {
    await prisma.destination.upsert({
      where:  { slug: dest.slug },
      update: dest,
      create: dest,
    });
    console.log(`  ✓ ${dest.name} (${dest.country})`);
  }

  console.log(`\nDone. ${DESTINATIONS.length} destinations seeded.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
