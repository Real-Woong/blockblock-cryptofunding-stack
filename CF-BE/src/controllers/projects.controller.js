import * as ProjectsService from "../services/projects.service.js";

export async function list(req, res, next) {
  try {
    console.log("[ProjectsController:list] query=", req.query);
    const result = await ProjectsService.list(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    console.log("[ProjectsController:getById] id=", req.params.id);
    const project = await ProjectsService.getById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json(project);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const viewerWallet = req.user.walletAddress;

    console.log("[ProjectsController:create] body=", req.body);

    // ✅ creatorWalletAddress는 클라이언트 입력을 믿지 말고 서버가 강제 세팅
    const body = {
      ...req.body,
      creatorWalletAddress: viewerWallet,
    };

    // ✅ 반드시 body를 넘겨야 함 (req.body 아님)
    const created = await ProjectsService.create(body);

    console.log("[ProjectsController:create] created.id=", created?.id);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const viewerWallet = req.user.walletAddress;

    // ✅ service에 viewerWallet 전달
    const updated = await ProjectsService.update(req.params.id, req.body, viewerWallet);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const viewerWallet = req.user.walletAddress;

    await ProjectsService.remove(req.params.id, viewerWallet);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function access(req, res, next) {
  try {
    const viewerWallet = req.user.walletAddress;
    const projectId = req.params.id;

    const result = await ProjectsService.access(projectId, viewerWallet);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}