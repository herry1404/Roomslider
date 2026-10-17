const rewards = require("../services/rewards.service");

const handle = (operation, status = 200) => async (req, res) => {
  try {
    const data = await operation(req);
    return res.status(status).json({ success: true, ...data });
  } catch (error) {
    const statusCode = Number.isInteger(error.status) ? error.status : 500;
    if (statusCode >= 500) console.error("REWARDS REQUEST FAILED:", error);
    return res.status(statusCode).json({
      success: false,
      message: statusCode >= 500 ? "Rewards request could not be completed." : error.message,
    });
  }
};

exports.publicInfo = handle((req) => rewards.getPublicInfo(req.params.slug, req.user));
exports.checkIn = handle((req) => rewards.checkIn({
  slug: req.params.slug,
  user: req.user,
  code: req.body && req.body.code,
}), 201);
exports.spin = handle((req) => rewards.spin({ slug: req.params.slug, user: req.user }), 201);
exports.myRewards = handle((req) => rewards.myRewards(req.user));
exports.dashboard = handle((req) => rewards.dashboard({ slug: req.params.slug, user: req.user }));
exports.regenerateCode = handle((req) => rewards.regenerateCode({ slug: req.params.slug, user: req.user }));
exports.setBudget = handle((req) => rewards.setBudget({
  slug: req.params.slug,
  user: req.user,
  dailyBudgetRs: req.body && req.body.dailyBudgetRs,
}));
exports.updateRewards = handle((req) => rewards.updateRewards({
  slug: req.params.slug,
  user: req.user,
  rewards: req.body && req.body.rewards,
}));
exports.redeem = handle((req) => rewards.redeem({
  slug: req.params.slug,
  user: req.user,
  code: req.body && req.body.code,
}));
