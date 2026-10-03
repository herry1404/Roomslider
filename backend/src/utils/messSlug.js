const { createUniqueSlug, ensurePublicSlugs } = require("./publicSlug");

module.exports = {
  createUniqueMessSlug: createUniqueSlug,
  ensureMessSlugs: (Mess, messes) => ensurePublicSlugs(Mess, messes, (mess) => mess.name),
};
