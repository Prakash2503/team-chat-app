// backend/src/middleware/errorHandler.js
/**
 * Centralized Express error handler.
 *
 * Use as the last middleware:
 *   app.use(errorHandler);
 *
 * It formats errors consistently as JSON for API clients and logs server-side.
 *
 * If an error has `status` or `statusCode` property, that status is used.
 * Otherwise 500 is used.
 *
 * Example usage in a controller:
 *   const err = new Error("Not allowed");
 *   err.status = 403;
 *   throw err; // or next(err)
 */

export function errorHandler(err, req, res, next) {
  // If response headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine status
  const status = err.status || err.statusCode || 500;

  // Prepare response body
  const body = {
    message: err.message || "Internal server error",
    // Only include details in non-production environments
    ...(process.env.NODE_ENV !== "production" && {
      // include stack for debugging (use carefully)
      stack: err.stack,
      // optionally include extra properties if present
      error: err,
    }),
  };

  // Log server-side for diagnostics (trim stack in prod)
  if (status >= 500) {
    console.error("Unhandled error:", err);
  } else {
    console.warn("Handled error:", err?.message || err);
  }

  return res.status(status).json(body);
}
