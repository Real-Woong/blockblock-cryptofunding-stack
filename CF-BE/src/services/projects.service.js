import * as ProjectsRepo from "../repositories/projects.repo.js";
import { badRequest, notFound, forbidden } from "../utils/httpError.js";
import { parsePagination, paginateArray } from "../utils/pagination.js";

const ALLOWED_SORT = new Set(["trending", "new", "ending-soon"]);
const ALLOWED_STATUS = new Set(["all", "live", "successful", "ended"]);

// ✅ creator-only 권한 체크 헬퍼
// - viewerWallet(요청자 지갑주소)와 프로젝트 creatorWalletAddress를 비교
// - 불일치 시 403 Forbidden
// - 위치: 서비스 파일 상단(상수들 아래) -> update/remove 등에서 공통 재사용
async function assertOwner(projectId, viewerWallet) {
  const project = await ProjectsRepo.findById(projectId);
  if (!project) throw notFound("Project not found");

  if (project.creatorWalletAddress !== viewerWallet) {
    throw forbidden("Only creator can manage this project");
  }

  return project;
}

export async function access(projectId, viewerWallet) {
  const project = await ProjectsRepo.findById(projectId);
  if (!project) throw notFound("Project not found");

  const isCreator = project.creatorWalletAddress === viewerWallet;

  let role = isCreator ? "creator" : "viewer";

  // ----------------------------
  // - 컨트랙트/인덱서 붙이면 hasFundedOnChain() 구현 후 아래 주석의 '//'만 제거
  // ----------------------------
  // if (isCreator) role = "creator";
  // else if (await hasFundedOnChain(projectId, viewerWallet)) role = "supporter";
  // else role = "viewer";

  const canManage = role === "creator";

  return {
    role,
    canManage,
    canDelete: canManage,
    // 출금은 컨트랙트에서 하지만 UI 노출/가드용 플래그로 둠
    canWithdraw: canManage,
  };
}

export async function list(query) {
  const { page, limit } = parsePagination(query, { page: 1, limit: 12 });

  const category = typeof query.category === "string" ? query.category : "All";
  const status = typeof query.status === "string" ? query.status : "all";
  const sort = typeof query.sort === "string" ? query.sort : "trending";

  if (!ALLOWED_STATUS.has(status)) throw badRequest("Invalid status");
  if (!ALLOWED_SORT.has(sort)) throw badRequest("Invalid sort");

  let items = await ProjectsRepo.getAll();

  // filter: category
  if (category && category !== "All") {
    items = items.filter((p) => p.category === category);
  }

  // filter: status
  if (status !== "all") {
    items = items.filter((p) => p.status === status);
  }

  // sort
  items = [...items];
  if (sort === "new") {
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === "ending-soon") {
    items.sort((a, b) => a.daysLeft - b.daysLeft);
  } else {
    // trending: raisedAmount 내림차순 + supporters 보조
    items.sort(
      (a, b) =>
        (b.raisedAmount - a.raisedAmount) || (b.supporters - a.supporters)
    );
  }

  return paginateArray(items, page, limit);
}

export async function getById(id) {
  const project = await ProjectsRepo.findById(id);
  return project || null;
}

export async function create(body) {
  // 최소 검증
  if (!body?.title || typeof body.title !== "string") throw badRequest("title is required");
  if (body.goalAmount == null || (typeof body.goalAmount !== "number" && typeof body.goalAmount !== "string")) throw badRequest("goalAmount is required");

  // creatorWalletAddress는 DB 필수 값
  if (!body?.creatorWalletAddress || typeof body.creatorWalletAddress !== "string") {
    throw badRequest("creatorWalletAddress is required");
  }

  // FE가 goalAmount를 string으로 보낼 수 있으니 숫자로 강제 변환
  const goalAmountNum = typeof body.goalAmount === "string" ? Number(body.goalAmount) : body.goalAmount;
  if (!Number.isFinite(goalAmountNum)) throw badRequest("goalAmount must be a number");

  // daysLeft/durationDays는 string으로도 올 수 있으니 숫자로 강제 변환
  const durationDaysNum = Math.trunc(Number(body.durationDays ?? body.daysLeft));
  if (!Number.isFinite(durationDaysNum) || durationDaysNum <= 0) {
    throw badRequest("durationDays is required");
  }

  const daysLeftNum = Math.trunc(Number(body.daysLeft ?? durationDaysNum));
  if (!Number.isFinite(daysLeftNum) || daysLeftNum < 0) {
    throw badRequest("daysLeft must be a number");
  }

  const created = await ProjectsRepo.create({
    title: body.title,
    description: typeof body.description === "string" ? body.description : "",
    category: typeof body.category === "string" ? body.category : "Others",
    status: "live",
    coverUrl: typeof body.coverUrl === "string" ? body.coverUrl : undefined,
    thumbnailUrl: typeof body.thumbnailUrl === "string" ? body.thumbnailUrl : undefined,
    goalAmount: Math.trunc(goalAmountNum),
    raisedAmount: 0,
    supporters: 0,
    daysLeft: daysLeftNum,
    durationDays: durationDaysNum,
    creatorWalletAddress: body.creatorWalletAddress,
  });

  // 응답에서는 기존 FE가 쓰던 creator 객체 형태로 내려준다(DB에는 walletAddress만 저장)
  return {
    ...created,
    creator: {
      walletAddress: created.creatorWalletAddress,
      verified: false,
      pastProjects: 0,
    },
  };
}

export async function update(projectId, body, viewerWallet) {
  // ✅ 소유권(creator) 강제
  await assertOwner(projectId, viewerWallet);

  const patch = {};

  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.description === "string") patch.description = body.description;
  if (typeof body.category === "string") patch.category = body.category;
  if (typeof body.coverUrl === "string") patch.coverUrl = body.coverUrl;
  if (typeof body.thumbnailUrl === "string") patch.thumbnailUrl = body.thumbnailUrl;
  if (typeof body.goalAmount === "number") patch.goalAmount = body.goalAmount;
  if (typeof body.daysLeft === "number") patch.daysLeft = body.daysLeft;
  if (typeof body.status === "string") patch.status = body.status;

  return await ProjectsRepo.update(projectId, patch);
}

export async function remove(projectId, viewerWallet) {
  // ✅ 소유권(creator) 강제
  await assertOwner(projectId, viewerWallet);

  try {
    await ProjectsRepo.remove(projectId);
    return;
  } catch (err) {
    // Prisma: 삭제 대상 레코드가 없으면 보통 P2025
    if (err?.code === "P2025") {
      throw notFound("Project not found");
    }
    throw err;
  }
}