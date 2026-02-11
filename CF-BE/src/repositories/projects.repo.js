// src/repositories/projects.repo.js
import { prisma } from "../db/prisma.js";

export function getAll() {
  return prisma.project.findMany({ orderBy: { createdAt: "desc" } });
}

export function findById(id) {
  return prisma.project.findUnique({ where: { id } });
}

export function create(data) {
  return prisma.project.create({ data });
}

export function update(id, patch) {
  return prisma.project.update({ where: { id }, data: patch });
}

export function remove(id) {
  return prisma.project.delete({ where: { id } });
}


// console.log("[repo] typeof prisma =", typeof prisma);
// console.log("[repo] prisma keys =", prisma && Object.keys(prisma));
// console.log("[repo] prisma.project =", prisma && prisma.project);


console.log("[repo] prisma file:", import.meta.url);
console.log("[repo] has project?", !!prisma.project);
console.log("[repo] has findMany?", !!prisma.project?.findMany);