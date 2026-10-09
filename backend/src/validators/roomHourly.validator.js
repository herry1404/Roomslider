const { z } = require("zod");

const parseJsonValue = (value, fallback) => {
  if (typeof value !== "string") return value === undefined ? fallback : value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const booleanValue = z.preprocess(
  (value) => value === "true" ? true : value === "false" ? false : value,
  z.boolean()
);

const hourlySlabsValue = z.preprocess(
  (value) => parseJsonValue(value, []),
  z.array(z.object({
    hours: z.coerce.number().gt(0, "Slab hours must be greater than zero"),
    price: z.coerce.number().gt(0, "Slab price must be greater than zero"),
  })).superRefine((slabs, context) => {
    const hours = new Set();
    slabs.forEach((slab, index) => {
      if (hours.has(slab.hours)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hourly slab hours must not be duplicated",
          path: [index, "hours"],
        });
      }
      hours.add(slab.hours);
    });
  })
);

const positiveOptionalNumber = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.coerce.number().gt(0, "Extra hour price must be greater than zero").optional()
);

const roomHourlySchema = z.object({
  hourlyEnabled: booleanValue.optional(),
  hourlyOnly: booleanValue.optional(),
  hourlySlabs: hourlySlabsValue.optional(),
  extraHourPrice: positiveOptionalNumber,
  checkIn24x7: booleanValue.optional(),
});

function parseRoomHourlyFields(body, { partial = false } = {}) {
  const input = Object.fromEntries(Object.entries({
    hourlyEnabled: body?.hourlyEnabled,
    hourlyOnly: body?.hourlyOnly,
    hourlySlabs: body?.hourlySlabs,
    extraHourPrice: body?.extraHourPrice,
    checkIn24x7: body?.checkIn24x7,
  }).filter(([, value]) => value !== undefined));
  const parsed = roomHourlySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Invalid hourly stay details",
    };
  }
  const data = partial
    ? parsed.data
    : { hourlyEnabled: false, hourlyOnly: false, hourlySlabs: [], checkIn24x7: false, ...parsed.data };
  if (partial && data.hourlyEnabled === false && data.hourlyOnly === undefined) {
    data.hourlyOnly = false;
  }
  if (data.hourlyOnly === true && data.hourlyEnabled !== true) {
    return { success: false, message: "Enable hourly stay before marking a room as hourly-only" };
  }
  if (data.hourlyEnabled === true && (!Array.isArray(data.hourlySlabs) || data.hourlySlabs.length === 0)) {
    return {
      success: false,
      message: "Add at least one hourly price slab when hourly stay is enabled",
    };
  }
  return { success: true, data };
}

module.exports = { parseRoomHourlyFields };
