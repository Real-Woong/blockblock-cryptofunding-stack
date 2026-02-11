import * as ProjectsRepo from "../repositories/projects.repo.js";
import * as FundingRepo from "../repositories/funding.repo.js";
import { badRequest } from "../utils/httpError.js";
import { paginateArray, parsePagination } from "../utils/pagination.js";

export async function getStats(walletAddress) {
  const addr = (walletAddress ?? "").toLowerCase();

  const allProjects = await ProjectsRepo.getAll();
  const createdProjects = allProjects.filter(
    (p) => (p.creatorWalletAddress ?? "").toLowerCase() === addr
  );

  const allFundings = await FundingRepo.getAll();
  const fundings = allFundings.filter(
    (f) => (f.fromWallet ?? "").toLowerCase() === addr
  );

  const totalFunded = fundings.reduce((sum, f) => sum + f.amount, 0);

  return {
    walletAddress,
    createdCount: createdProjects.length,
    fundedCount: fundings.length,
    totalFundedAmount: totalFunded,
  };
}

export async function getProjects(walletAddress, type) {
  if (type !== "created" && type !== "funded") {
    throw badRequest("type must be 'created' or 'funded'");
  }

  const allProjects = await ProjectsRepo.getAll();

  let items = [];
  if (type === "created") {
    items = allProjects.filter(
      (p) => (p.creatorWalletAddress ?? "").toLowerCase() === walletAddress.toLowerCase()    );
  } else {
    const allFundings = await FundingRepo.getAll();
    const myFundings = allFundings.filter(
      (f) => f.fromWallet.toLowerCase() === walletAddress.toLowerCase()
    );
    const fundedProjectIds = new Set(myFundings.map((f) => f.projectId));
    items = allProjects.filter((p) => fundedProjectIds.has(p.id));
  }

  // 기본 pagination도 지원(프론트 필요하면 바로 사용 가능)
  const { page, limit } = parsePagination({ page: 1, limit: 50 }, { page: 1, limit: 50 });
  return paginateArray(items, page, limit);
}

export async function getTransactions(walletAddress) {
  // 지금은 funding을 transaction처럼 반환 (온체인 연동 전 단계)
  const allFundings = await FundingRepo.getAll();
  const tx = allFundings
    .filter((f) => f.fromWallet.toLowerCase() === walletAddress.toLowerCase())
    .map((f) => ({
      id: f.id,
      type: "funding",
      projectId: f.projectId,
      amount: f.amount,
      token: f.token,
      txHash: f.txHash || null,
      createdAt: f.createdAt,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return { walletAddress, items: tx };
}