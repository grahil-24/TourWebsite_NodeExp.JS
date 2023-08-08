const express = require('express');

const userController = require('../controllers/userController');

const authController = require('../controllers/authController');

const reviewController = require('../controllers/reviewController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.route('/').get(userController.getAllUsers).post(userController.createUser);

router.post('/forgotPassword', authController.forgotPassword);
// as we are modifying user's password it will be patch request and not post request, and we will take token as req parameter

router.use(authController.protect); // protects all routes after this point

router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMyPassword', authController.updatePassword); // only logged in user can change current password
router.delete('/deleteMe', userController.deleteMe);
// field in form which will be uploading image is called photo. single means only 1 photo
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.restrictTo('admin'));
router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);

module.exports = router;
