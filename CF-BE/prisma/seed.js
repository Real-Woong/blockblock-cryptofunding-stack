console.log("CA exists?", fs.existsSync(path.resolve("certs/rds-global-bundle.pem")));
console.log("CA bytes:", fs.readFileSync(path.resolve("certs/rds-global-bundle.pem")).length);

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "../src/db/pgPool";
import fs from "fs";
import path from "path";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing in .env");

const ca = fs.readFileSync(path.resolve("certs/rds-global-bundle.pem"), "utf8");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { ca, rejectUnauthorized: true },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// 이하 seed 로직 그대로...
// 이하 seed 로직은 그대로

const MY_WALLET =
  process.env.MY_WALLET ||
  "0x5d1815281a375a6d954afd88641a59a4e8b7e3dd8b19cbe51878ef61e563bab7";

const THUMBNAILS = [
  "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80",
  "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=800&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
  "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
];

const COVERS = [
  "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80",
  "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=1200&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80",
  "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&q=80",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80",
];

const OTHER_WALLETS = [
  "0x1111111111111111111111111111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222222222222222222222222222",
  "0x3333333333333333333333333333333333333333333333333333333333333333",
  "0x4444444444444444444444444444444444444444444444444444444444444444",
  "0x5555555555555555555555555555555555555555555555555555555555555555",
  "0x6666666666666666666666666666666666666666666666666666666666666666",
];

const CATEGORIES = ["Tech", "Art", "Games", "Social Impact", "Music", "Education"];

function pick(arr, i) {
  return arr[i % arr.length];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedProjects() {
  const projectsInput = Array.from({ length: 10 }).map((_, i) => {
    const isMine = i < 3;
    const creatorWalletAddress = isMine ? MY_WALLET : pick(OTHER_WALLETS, i);

    const goalAmount = randInt(500, 5000) * 10;
    const daysLeft = [3, 7, 14, 30, 45][i % 5];

    return {
      title: isMine ? `[MY] Demo Project ${i + 1}` : `Demo Project ${i + 1}`,
      description: "Seeded demo project (DB mock).",
      category: pick(CATEGORIES, i),
      status: "live",
      goalAmount,
      daysLeft,
      oneLiner: "Seeded demo one-liner.",
      durationDays: daysLeft,
      thumbnailUrl: pick(THUMBNAILS, i),
      coverUrl: pick(COVERS, i),
      creatorWalletAddress,
      raisedAmount: 0,
      supporters: 0,
    };
  });

  const created = [];
  for (const p of projectsInput) {
    created.push(await prisma.project.create({ data: p }));
  }
  return created;
}

async function main() {
  // FK 관계가 있으면 자식부터 삭제 (Reward -> Project)
  await prisma.funding.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.project.deleteMany();

  const projects = await seedProjects();

  // 각 프로젝트에 Reward mock 2개씩 생성
  const rewards = [];
  for (const p of projects) {
    rewards.push(
      {
        projectId: p.id,
        title: "Thanks",
        description: "A simple thank-you reward",
        amount: 10,
      },
      {
        projectId: p.id,
        title: "Supporter",
        description: "Listed as a supporter",
        amount: 50,
      }
    );
  }
  await prisma.reward.createMany({ data: rewards });

  console.log("✅ Seed completed:", {
    projects: await prisma.project.count(),
    rewards: await prisma.reward.count(),
    fundings: await prisma.funding.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });