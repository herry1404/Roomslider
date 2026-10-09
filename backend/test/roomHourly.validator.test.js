const test = require("node:test");
const assert = require("node:assert/strict");
const { parseRoomHourlyFields } = require("../src/validators/roomHourly.validator");

test("parses hourly slabs and defaults existing-style room data to disabled", () => {
  const defaultFields = parseRoomHourlyFields({});
  assert.equal(defaultFields.success, true);
  assert.deepEqual(defaultFields.data, {
    hourlyEnabled: false,
    hourlyOnly: false,
    hourlySlabs: [],
    checkIn24x7: false,
  });
  assert.equal(parseRoomHourlyFields({
    hourlyEnabled: "true",
    hourlySlabs: '[{"hours":"3","price":"350"},{"hours":"6","price":"600"}]',
    extraHourPrice: "120",
    checkIn24x7: "true",
  }).success, true);
});

test("rejects non-positive and duplicate slab values", () => {
  for (const hourlySlabs of [
    [{ hours: 0, price: 350 }],
    [{ hours: 3, price: 0 }],
    [{ hours: 3, price: 350 }, { hours: 3, price: 500 }],
  ]) {
    assert.equal(parseRoomHourlyFields({ hourlyEnabled: true, hourlySlabs }).success, false);
  }
});

test("hourly-only listings require hourly stay to be enabled", () => {
  assert.equal(parseRoomHourlyFields({
    hourlyEnabled: true,
    hourlyOnly: true,
    hourlySlabs: [{ hours: 3, price: 350 }],
  }).success, true);
  assert.equal(parseRoomHourlyFields({ hourlyOnly: true }).success, false);
  assert.equal(parseRoomHourlyFields({ hourlyEnabled: false, hourlyOnly: true }).success, false);
});

test("does not alter hourly fields on partial room updates", () => {
  assert.deepEqual(parseRoomHourlyFields({ title: "Updated title" }, { partial: true }), {
    success: true,
    data: {},
  });
  assert.deepEqual(parseRoomHourlyFields({ hourlyEnabled: false }, { partial: true }), {
    success: true,
    data: { hourlyEnabled: false, hourlyOnly: false },
  });
});
