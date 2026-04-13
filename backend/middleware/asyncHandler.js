/** Express 4: forward async rejections to error middleware */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = asyncHandler;
