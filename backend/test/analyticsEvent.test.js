const test = require("node:test");
const assert = require("node:assert/strict");
const { getRange } = require("../src/controllers/analyticsEvent.controller");

test("event analytics accepts UI range values with or without the day suffix", () => {
  for (const [value, days] of [["7d", 7], ["30d", 30], ["90d", 90], ["7", 7], ["30", 30], ["90", 90]]) {
    const range = getRange(value);
    assert.equal(range.days, days);
    assert.equal(range.end.getTime() - range.start.getTime(), days * 86400000);
  }
});

test("event analytics defaults to 7 days and rejects unsupported ranges", () => {
  assert.equal(getRange().days, 7);
  assert.equal(getRange("14d"), null);
  assert.equal(getRange("today"), null);
});
