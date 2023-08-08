const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); //eslint-disable-line
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
    jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        secure: false, // cookie will be sent only under secure condition ie requests sent through https. only activated in production, for now it is kept false
        httpOnly: true, // cookie cannot be accessed or modified by the browser
    };

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    //sending JWT to cookies as it is much secure
    res.cookie('jwt', token);

    user.password = undefined; // we dont want password to show up when we send user in response

    res.status(statusCode).json({
        status: 'success',
        token, //sending the token to the user
        data: {
            user: user,
        },
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    // const newUser = await User.create(req.body);  this is wrong as anyone can register as admin

    //the correct way
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role,
    });

    const url = `${req.protocol}://${req.get('host')}/me`;

    console.log(url);
    await new Email(newUser, url).sendWelcome();

    //when new user signs up, we automatically log in and send them a token
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body; // called object destructuring

    // 1) Check email and password exists
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password'); //as we did not select password when we fetch user details(for security reasons) we now have to manually select it
    console.log('reached here');
    console.log(user);
    if (!user) {
        console.log('incorrect email');
    } else {
        console.log(user.password);
        console.log(password);
    }
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    // 3) if everything ok, send token to client
    createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({
        status: 'success',
    });
};

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it exists
    // tokens are sent in request headers
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(new AppError('Please log in to get access', 401));
    }
    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded);
    // 3) User still exists or not
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The User belonging to the token does no longer exist', 401));
    }

    // 4) Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please login again', 401));
    }

    // if passed all the steps, grant access to the protected routes
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

//Only for rendered pages. To check if user is logged in or not. Used when we dont want to show log in, sign up button when user is logged in and vice versa
exports.isLoggedIn = async (req, res, next) => {
    // 1) Getting token and check if it exists
    // tokens are sent in request headers
    if (req.cookies.jwt) {
        try {
            // 2) Verify token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            console.log(decoded);
            // 3) User still exists or not
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 4) Check if user changed password after token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // if passed all the steps, grant access to the protected routes
            res.locals.user = currentUser; //eslint-disable-line
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

// ...roles means array of arguments passed, as restricted roles is not fixed. Arguments
// cannot be passed to middleware functions, so wrapper function are used which return the
// middleware
/* eslint-disable */
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('Invalid email id! Please enter a valid one', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    // const message = `Forgot your password? Submit a patch request with your new password and passwordConfirm to ${resetURL}.\nIf you didnt forget your password, please ignore this email `;

    try {
        // await sendEmail({
        //     email: user.email,
        //     subject: 'Your password reset token (valid for 10 mins)',
        //     message,
        // });
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('There was an error while sending the email. Try again later!', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // to check if password reset token has expired or not
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

    // 2) If token has not expired, and there is a user, set the new password
    if (!user) {
        return next(new AppError('The password reset token has expired! Please try again', 400));
    }

    // 3) Update passwordChangedAt property for the user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 4) Log in the user and send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password'); //as we did not select password when we fetch user details(for security reasons) we now have to manually select it

    // 2) Check if current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Incorrect current password', 401));
    }

    // 3) Update the password
    user.passwordConfirm = req.body.passwordConfirm;
    user.password = req.body.password;
    await user.save();

    // 4) log the user in again, send new JWT to the user
    createSendToken(user, 200, res);
});
