import * as FundingRepo from "../repositories/funding.repo.js";
import * as ProjectsRepo from "../repositories/projects.repo.js";
import { badRequest, notFound } from "../utils/httpError.js";
import { parsePagination, paginateArray } from "../utils/pagination.js";
import * as ProjectsService from "./projects.service.js";

async function getProjectOrThrow(projectId) {
  console.log("[funding] projectId raw =", JSON.stringify(projectId));

  const project = await ProjectsService.getById(projectId);
  const found = !!project;
  console.log("[funding] project found =", found);

  if (!project) {
    throw notFound("Project not found");
  }

  return project;
}

export async function getProjectFundingSummary(projectId, query) {

  const project = await getProjectOrThrow(projectId);

  const { page, limit } = parsePagination(query, { page: 1, limit: 20 });

  const all = await FundingRepo.findByProjectId(projectId);
  all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const raisedAmount = all.reduce((sum, f) => sum + (typeof f.amount === "number" ? f.amount : 0), 0);
  const supporters = new Set(all.map((f) => f.fromWallet)).size;

  const paged = paginateArray(all, page, limit);

  return {
    projectId,
    goalAmount: project.goalAmount,
    raisedAmount,
    supporters,
    ...paged, // { items, meta }
  };
}

export async function createFunding(projectId, body) {
  await getProjectOrThrow(projectId);

  const fromWallet = body?.fromWallet;
  const amount = body?.amount;
  const token = body?.token || "SUI";
  const message = typeof body?.message === "string" ? body.message : "";
  const txHash = typeof body?.txHash === "string" ? body.txHash : null;

  if (!fromWallet || typeof fromWallet !== "string") throw badRequest("fromWallet is required");
  if (typeof amount !== "number" || !(amount > 0)) throw badRequest("amount must be positive number");

  const created = await FundingRepo.create({
    projectId,
    fromWallet,
    amount,
    token,
    message,
    txHash,
  });

  return created;
}