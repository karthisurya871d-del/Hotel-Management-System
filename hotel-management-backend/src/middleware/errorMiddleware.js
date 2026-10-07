const errorHandler = (err, req, res, next) => {
    console.error("Unhandled error:", err.message);
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        message: err.message || "Internal server error."
    });
};
module.exports = errorHandler;
