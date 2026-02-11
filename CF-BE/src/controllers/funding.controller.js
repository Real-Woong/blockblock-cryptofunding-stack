import * as FundingService from "../services/funding.service.js";

export async function getSummary(req, res, next) {
  try {
    const result = await FundingService.getProjectFundingSummary(req.params.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createFunding(req, res, next) {
  try {
    const result = await FundingService.createFunding(req.params.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}