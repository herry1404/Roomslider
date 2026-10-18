function isAdViewComplete(startedAt, now, durationSec) {
  const startTime = new Date(startedAt).getTime();
  const currentTime = new Date(now).getTime();
  return Number.isFinite(startTime)
    && Number.isFinite(currentTime)
    && Number.isFinite(durationSec)
    && durationSec >= 10
    && durationSec <= 15
    && currentTime - startTime >= durationSec * 1000 * 0.9;
}

module.exports = { isAdViewComplete };
