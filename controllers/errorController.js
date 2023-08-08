const AppError = require('../utils/appError');

const handleJWTError = () => new AppError('Invalid Token, Please log in again', 401);

const handleJWTExpiredError = () => new AppError('Expired Token! Please log in again', 401);

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
        // Rendered website
    } else {
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.message,
        });
    }
};

const sendErrorProd = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        //operational error. Trusted, so send details to client
        if (err.operational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
            //programming error, do not send details to client. log it in console
        } else {
            console.error('ERROR: ', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong',
            });
        }
    } else {
        if (err.operational) {
            res.status(err.statusCode).render('error', {
                title: 'Something went wrong!',
                msg: err.message,
            });
            //programming error, do not send details to client. log it in console
        } else {
            console.error('ERROR: ', err);
            res.status(err.statusCode).render('error', {
                title: 'Something went wrong!',
                msg: 'Please try again later',
            });
        }
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
        sendErrorDev(err, req, res);
    } else {
        let error = Object.create(err);
        console.log(error.name);
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
        sendErrorProd(error, req, res);
    }
};
