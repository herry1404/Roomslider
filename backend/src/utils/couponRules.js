async function tryClaimCouponStock(CouponModel, couponId, now) {
  return CouponModel.findOneAndUpdate(
    {
      _id: couponId,
      active: true,
      stock: { $gt: 0 },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    },
    { $inc: { stock: -1, claimed: 1 } },
    { returnDocument: "after" }
  );
}

module.exports = { tryClaimCouponStock };
