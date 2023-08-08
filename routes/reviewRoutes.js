const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router({
    mergeParams: true,
}); //also a middleware

const reviewController = require('../controllers/reviewController');

const catchAsync = require('../utils/catchAsync');

router.use(authController.protect);

// only logged in users and user users( not admin or guide or lead guide) can post reviews
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo('user'), reviewController.setTourUserIds, reviewController.createReview);

router
    .route('/:id')
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)
    .get(reviewController.getReview);

module.exports = router;
