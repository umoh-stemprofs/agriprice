import "dotenv/config";
import { Crop, PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

/**
 * Seed for step 1: one farmer, one farm, three crops of stock, the cost of
 * waiting for each. No prices and no weather yet — step 2 owns the market feed.
 *
 * Idempotent: running it twice leaves the same rows, not duplicates.
 * Demo password is documented in README.md only.
 */

const db = new PrismaClient();

const DEMO = {
  userId: "usr_demo",
  email: "demo@agriprice.test",
  name: "Ada Okonkwo",
  password: "demo1234",
  farmId: "farm_demo",
  farmName: "Port Harcourt farm",
  // Default farm location from docs/00-global.md §3.
  lat: 4.8156,
  lon: 7.0498,
};

const STOCK: { id: string; crop: Crop; qtyKg: number; note: string }[] = [
  { id: "inv_demo_maize", crop: Crop.MAIZE, qtyKg: 1200, note: "Dried, in bags" },
  { id: "inv_demo_cassava", crop: Crop.CASSAVA, qtyKg: 600, note: "Fresh roots, sell within a week" },
  { id: "inv_demo_tomato", crop: Crop.TOMATO, qtyKg: 350, note: "Crates, harvested two days ago" },
];

// Placeholder numbers. An expert must review them before any real use.
const COSTS: {
  crop: Crop;
  storageKoboPerKgPerWeek: number; // ₦2/kg/week = 200 kobo
  spoilagePctPerWeek: number;
  minGainPct: number;
}[] = [
  { crop: Crop.MAIZE, storageKoboPerKgPerWeek: 200, spoilagePctPerWeek: 1, minGainPct: 2 },
  { crop: Crop.CASSAVA, storageKoboPerKgPerWeek: 100, spoilagePctPerWeek: 4, minGainPct: 2 },
  { crop: Crop.TOMATO, storageKoboPerKgPerWeek: 300, spoilagePctPerWeek: 12, minGainPct: 3 },
];

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG")}`;

async function main() {
  const passHash = await hash(DEMO.password, 10);

  const user = await db.user.upsert({
    where: { email: DEMO.email },
    update: { name: DEMO.name, passHash },
    create: { id: DEMO.userId, email: DEMO.email, name: DEMO.name, passHash },
  });

  const farm = await db.farm.upsert({
    where: { id: DEMO.farmId },
    update: {
      userId: user.id,
      name: DEMO.farmName,
      lat: DEMO.lat,
      lon: DEMO.lon,
      currency: "NGN",
    },
    create: {
      id: DEMO.farmId,
      userId: user.id,
      name: DEMO.farmName,
      lat: DEMO.lat,
      lon: DEMO.lon,
      currency: "NGN",
    },
  });

  for (const item of STOCK) {
    await db.inventoryItem.upsert({
      where: { id: item.id },
      update: { farmId: farm.id, crop: item.crop, qtyKg: item.qtyKg, note: item.note },
      create: { ...item, farmId: farm.id },
    });
  }

  for (const cost of COSTS) {
    await db.costSetting.upsert({
      where: { farmId_crop: { farmId: farm.id, crop: cost.crop } },
      update: { ...cost },
      create: { ...cost, farmId: farm.id },
    });
  }

  // Make a re-run converge on exactly this demo data.
  await db.inventoryItem.deleteMany({
    where: { farmId: farm.id, id: { notIn: STOCK.map((s) => s.id) } },
  });
  await db.costSetting.deleteMany({
    where: { farmId: farm.id, crop: { notIn: COSTS.map((c) => c.crop) } },
  });

  const [stockRows, costRows] = await Promise.all([
    db.inventoryItem.findMany({ where: { farmId: farm.id }, orderBy: { crop: "asc" } }),
    db.costSetting.findMany({ where: { farmId: farm.id }, orderBy: { crop: "asc" } }),
  ]);

  console.log(`\nFarm   ${farm.name} (${farm.lat}, ${farm.lon}) · ${farm.currency}`);
  console.log(`User   ${user.name} <${user.email}>`);
  console.log(`\nStock  ${stockRows.length} crops, ${stockRows.reduce((n, r) => n + r.qtyKg, 0).toLocaleString("en-NG")} kg in total`);
  for (const row of stockRows) {
    const cost = costRows.find((c) => c.crop === row.crop);
    const waiting =
      cost === undefined
        ? "no costs set"
        : `${naira(cost.storageKoboPerKgPerWeek)}/kg/wk storage · ${cost.spoilagePctPerWeek}% spoilage/wk · hold only if ≥ ${cost.minGainPct}%`;
    console.log(`       ${row.crop.padEnd(10)} ${String(row.qtyKg).padStart(5)} kg   ${waiting}`);
  }
  console.log(`\nSeed complete.\n`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
