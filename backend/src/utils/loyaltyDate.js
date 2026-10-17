const istDay = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const fields = {};
  for (const part of parts) if (part.type !== "literal") fields[part.type] = part.value;
  return `${fields.year}-${fields.month}-${fields.day}`;
};

const nextIstMidnight = (date = new Date()) => {
  const [year, month, day] = istDay(date).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1) - 330 * 60 * 1000);
};

module.exports = { istDay, nextIstMidnight };
