const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const { default: isEmail } = require('validator/lib/isEmail');

const bcrypt = require('bcryptjs'); // eslint-disable-line

//name, email, photo, password, passwordConfirm
const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A User must have a name'],
        trim: true,
        maxlength: [25, 'A user name cant be more than 25 characters'],
        minlength: [5, 'A user name cant be less than 5 characters'],
    },

    email: {
        type: String,
        required: [true, 'A user must have an email'],
        trim: true,
        unique: true,
        validate: [validator.isEmail, 'invalid email'],
        lowercase: true,
    },

    photo: {
        type: String,
        trim: true,
        default: 'default.jpg',
    },

    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },

    password: {
        type: String,
        required: [true, 'A user must enter the password'],
        trim: true,
        maxlength: [200, 'A password cant be more than 200 characters'],
        minlength: [8, 'A password cant be less than 8 characters'],
        select: false,
    },

    passwordConfirm: {
        type: String,
        required: [true, 'A user must confirm the password'],
        trim: true,
        validate: {
            //This only works on CREATE and SAVE!!!
            validator: function (el) {
                return el === this.password;
            },
            message: 'same!',
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

userSchema.pre('save', async function (next) {
    //Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12); //encrypting password with cost of 12

    this.passwordConfirm = undefined; //delete the passwordConfirm before inserting it in database
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// we will exclude inactive users in all find functions like find, findAndDelete, findAndUpdate etc
userSchema.pre(/^find/, function (next) {
    // this points to the current query
    this.find({ active: { $ne: false } });
    next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10); // time is in ms while JWTTimestamp is in seconds
        console.log(this.passwordChangedAt, JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
    }
    // false means password has not been changed, that is token was issued after password was changed
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    console.log({ resetToken }, this.passwordResetToken);

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
