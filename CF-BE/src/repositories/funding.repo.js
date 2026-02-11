// src/repositories/funding.repo.js
import { prisma } from "../db/prisma.js";

export function getAll() {
  return prisma.funding.findMany({ orderBy: { createdAt: "desc" } });
}

export function findByProjectId(projectId) {
  return prisma.funding.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export function create(data) {
  return prisma.funding.create({ data });
}


console.log("[prisma] keys:", Object.keys(prisma));
console.log("[prisma] has funding:", !!prisma.funding);
console.log("[prisma] has project:", !!prisma.project);