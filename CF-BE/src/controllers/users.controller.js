import * as UsersService from "../services/users.service.js";
import * as UsersRepo from "../repositories/users.repo.js";

export async function getProfile(req, res) {
  const { walletAddress } = req.params;
  const p = await UsersRepo.getProfile(walletAddress);

  // 아직 저장된 적 없으면 기본값 내려주기(프론트 UX)
  if (!p) {
    return res.json({
      ok: true,
      walletAddress,
      profile: { displayName: "My Profile", description: "Manage your projects and contributions" },
    });
  }

  return res.json({ ok: true, walletAddress, profile: p });
}

export async function stats(req, res, next) {
  try {
    const result = await UsersService.getStats(req.params.walletAddress);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function projects(req, res, next) {
  try {
    const { type } = req.query; // created | funded
    const result = await UsersService.getProjects(req.params.walletAddress, type);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function transactions(req, res, next) {
  try {
    const result = await UsersService.getTransactions(req.params.walletAddress);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res) {
  const { walletAddress } = req.params;
  const { displayName, description } = req.body ?? {};

  // 최소 검증
  if (typeof displayName !== "string" || typeof description !== "string") {
    return res.status(400).json({ message: "displayName and description are required" });
  }

  const saved = await UsersRepo.upsertProfile(walletAddress, { displayName, description });
  return res.json({ ok: true, walletAddress, profile: saved });
}