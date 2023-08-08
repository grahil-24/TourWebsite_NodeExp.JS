const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError('No Doc found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    });

exports.updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true, //returns new document
            runValidators: true,
        });

        if (!doc) {
            return next(new AppError('No Doc found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                doc,
            },
        });
    });

exports.createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        // const newTour = new Tour({})
        // newTour.save()
        // console.log(req.body);
        const newDoc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                newDoc,
            },
        });
    });

exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (popOptions) query = query.populate(popOptions);
        const doc = await query;

        if (!doc) {
            return next(new AppError('No Tour found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

exports.getAll = (Model) =>
    catchAsync(async (req, res, next) => {
        // to allow for nested GET reviews on tour
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };

        console.log(req.query);

        const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();
        // const docs = await features.query.explain(); // .explain() returns stats of the query
        const docs = await features.query;
        // const query = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy');

        //5. SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: docs.length,
            data: {
                docs,
            },
        });
    });
