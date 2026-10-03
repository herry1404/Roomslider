const slugify = require("slugify");

const createUniqueSlug = async (Model, name, excludeId = null) => {
  const base = slugify(String(name || ""), { lower: true, strict: true, trim: true }) || "listing";
  let slug = base;
  let suffix = 2;

  while (await Model.exists({
    slug,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const ensurePublicSlugs = async (Model, records, getName) => {
  for (const record of records) {
    if (record.slug) continue;
    const slug = await createUniqueSlug(Model, getName(record), record._id);
    await Model.updateOne({ _id: record._id, $or: [{ slug: { $exists: false } }, { slug: "" }] }, { $set: { slug } });
    record.slug = slug;
  }
  return records;
};

module.exports = { createUniqueSlug, ensurePublicSlugs };
