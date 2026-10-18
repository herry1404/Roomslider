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
exports.spin = handle((req) => rewards.spin({
  slug: req.params.slug,
  user: req.user,
  type: req.body && req.body.type,
}), 201);
exports.startAd = handle((req) => rewards.startAd({ slug: req.params.slug, user: req.user }), 201);
exports.completeAd = handle((req) => rewards.completeAd({
  slug: req.params.slug,
  user: req.user,
  token: req.body && req.body.token,
}));
exports.myRewards = handle((req) => rewards.myRewards(req.user));
exports.adminCatalog = handle((req) => rewards.adminCatalog(req.user));
exports.createSponsor = handle((req) => rewards.createSponsor({ user: req.user, fields: req.body }), 201);
exports.updateSponsor = handle((req) => rewards.updateSponsor({ user: req.user, id: req.params.id, fields: req.body }));
exports.createCoupon = handle((req) => rewards.createCoupon({ user: req.user, fields: req.body }), 201);
exports.updateCoupon = handle((req) => rewards.updateCoupon({ user: req.user, id: req.params.id, fields: req.body }));
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
