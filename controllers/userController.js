const User = require('../models/userModel');
//image processing library for node
const sharp = require('sharp');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const multer = require('multer');

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         //user-userid-timestamp.jpeg
//         // user-872ead784r74qcn3847-132478454.jpeg
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     },
// });

// photo not saved in disk storage but in buffer
const multerStorage = multer.memoryStorage();

//Multer filter. filter is for only allowing image files and not any other files
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images', 404), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

// resizing user photo, if user uploads a very large photo
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    // we want square images, so same height and width and converting them to jpeg. Quality is 90% of original, so as to save space
    await sharp(req.file.buffer).resize(500, 500).toFormat('jpeg').jpeg({ quality: 90 }).toFile(`public/img/users/${req.file.filename}`);

    next();
});

// filter out fields which are not allowed to be updated
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el];
        }
    });
    return newObj;
};

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
    console.log(req.file);
    console.log(req.body);
    // 1) Create user if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('You cant change password through this route', 400));
    }

    // 2) Update user document
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'Error',
        message: 'This route is not defined! Please use /signup instead',
    });
};

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    // we dont send back any data we delete
    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// Do not update passwords with this
exports.updateUser = factory.updateOne(User);
exports.getAllUsers = factory.getAll(User);
exports.deleteUser = factory.deleteOne(User);
exports.getUser = factory.getOne(User);
