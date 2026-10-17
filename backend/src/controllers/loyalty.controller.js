const loyalty = require("../services/loyalty.service");

const send = (res, operation, status = 200) => async (req) => {
  try {
    const data = await operation(req);
    return res.status(status).json({ success: true, ...data });
  } catch (error) {
    const statusCode = Number.isInteger(error.status) ? error.status : 500;
    if (statusCode >= 500) console.error("LOYALTY REQUEST FAILED:", error.message);
    return res.status(statusCode).json({
      success: false,
      ...(error.code ? { code: error.code } : {}),
      message: statusCode >= 500 ? "Loyalty request could not be completed." : error.message,
    });
  }
};

exports.createCard = (req, res) => send(res, (request) => {
  const body = request.body || {};
  return loyalty.createCard({ slug: request.params.slug, name: body.name, phone: body.phone });
}, 201)(req);

exports.getCard = (req, res) => send(res, (request) =>
  loyalty.getCard({ slug: request.params.slug, cardToken: request.get("x-card-token") })
)(req);

exports.spin = (req, res) => send(res, (request) =>
  loyalty.spin({ slug: request.params.slug, cardToken: request.get("x-card-token") })
)(req);

exports.lookup = (req, res) => send(res, (request) =>
  loyalty.lookupCard({ slug: request.params.slug, cardCode: request.body && request.body.cardCode })
)(req);

exports.stamp = (req, res) => send(res, (request) =>
  loyalty.stampCard({ slug: request.params.slug, cardCode: request.body && request.body.cardCode })
)(req);

exports.redeem = (req, res) => send(res, (request) =>
  loyalty.redeem({ slug: request.params.slug, code: request.body && request.body.code })
)(req);

exports.demoReset = (req, res) => send(res, (request) =>
  loyalty.demoReset({ slug: request.params.slug, cardCode: request.body && request.body.cardCode })
)(req);
