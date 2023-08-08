const express = require('express');

const router = express.Router(); //also a middleware

const tourController = require('../controllers/tourController');

const authController = require('../controllers/authController');

const reviewRouter = require('./reviewRoutes');

const catchAsync = require('../utils/catchAsync');

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
    .route('/monthly-plan/:year')
    .get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);

// router.param('id', tourController.checkID);

router
    .route('/')
    .get(tourController.getAllTours)
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour); //also a middleware, but only for some specific urls

// id is only availaible to tour router and not review router, so we have to enable mergeParam in review router
router.use('/:tourId/reviews', reviewRouter);

// to find a tour withing a distance
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

//distance of all routes from a specified point
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour
    )
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

module.exports = router;
