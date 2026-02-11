// src/repositories/users.repo.js
import { prisma } from "../db/prisma.js";

export async function upsertProfile(walletAddress, { displayName, description }) {
  return prisma.user.upsert({
    where: { walletAddress },
    update: { displayName, description },
    create: { walletAddress, displayName, description },
  });
}

export async function getProfile(walletAddress) {
  return prisma.user.findUnique({
    where: { walletAddress },
    select: { walletAddress: true, displayName: true, description: true, createdAt: true, updatedAt: true },
  });
}