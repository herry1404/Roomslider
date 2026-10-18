const { randomInt } = require("crypto");
const { isAdViewComplete } = require("../utils/adRules");

class LocalAdProvider {
  start(sponsors) {
    if (!sponsors.length) return null;
    return sponsors[randomInt(sponsors.length)];
  }

  complete(adView, now) {
    return isAdViewComplete(adView.startedAt, now, adView.sponsorId.durationSec);
  }
}

class GoogleRewardedAdProvider {
  start() {
    const error = new Error("Google rewarded ads are not implemented.");
    error.status = 501;
    throw error;
  }

  complete() {
    const error = new Error("Google rewarded ads are not implemented.");
    error.status = 501;
    throw error;
  }
}

module.exports = {
  providers: {
    local: new LocalAdProvider(),
    google: new GoogleRewardedAdProvider(),
  },
};
