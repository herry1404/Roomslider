// Returns a user-safe error message. Hides internal details in production.
const safeMsg = (err) => {
  if (process.env.NODE_ENV !== "production") return err && err.message;
  if (err && (err.name === "ValidationError" || err.name === "CastError")) {
    return "Invalid input data";
  }
  return "Something went wrong. Please try again later.";
};

module.exports = safeMsg;
