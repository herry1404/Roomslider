// Jab koi route match hi na ho (galat URL)
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

// Global error handler - kisi bhi controller mein error throw ho toh yahan aayega
const errorHandler = (err, req, res, next) => {
  console.error("ERROR 👉", err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = { notFound, errorHandler };
