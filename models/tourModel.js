const mongoose = require('mongoose');

const slugify = require('slugify');

const validator = require('validator');

const User = require('./userModel');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [40, 'A tour name cant be more than 40 characters'],
            minlength: [10, 'A tour name cant be less than 10 characters'],
            // validate: [validator.isAlpha, 'A tour name should only contain alphabets'],
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration'],
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size'],
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                //difficulty can only be these three values
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either: easy, medium or difficult',
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [0, 'rating cant be less than 0'],
            max: [5, 'rating cant be more than 5'],
            set: (val) => Math.round(val * 10) / 10, // rounding the ratingsAverage field
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price'],
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (value) {
                    // this only points to current document on NEW document creation
                    return value < this.price;
                },
                message: 'price discount cannot be greater than price',
            },
        },
        summary: {
            type: String,
            trim: true, //removes all the whitespace in the beginning and the end of the string
            required: [true, 'A tour must have a description'],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image'],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false, //wont be displayed to client. No need to specify in query, or .select() or anything
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number], // we expect an array of numbers
            address: String,
            description: String,
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        guides: [
            // array means it will be subdocuments
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        toJSON: {
            virtuals: true,
        },
        toObject: {
            virtuals: true,
        },
    }
);

tourSchema.index({ price: 1, ratingsAverage: -1 }); // 1 means sorting price in ascending order and -1 for descending. Indexing is used for faster searching. This is compound indexing as it is done on more than 1 field
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // startlocation should be indexed to a 2d sphere. This is helpful in geoWithin operator
tourSchema.virtual('durationWeeks').get(function () {
    //virtual property. Does not get stored in database
    //we need this keyword so arrow function wont work here
    return this.duration / 7;
});

// virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour', // name of the field where tour ID is stored in review model
    localField: '_id', // where tour ID is stored in local document that is in tour model
});

//DOCUMENT MIDDLEWARE
//pre middleware. means it will run before .save() and .create() but not .insertMany()
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true }); //this points to the currently processed document
    next();
}); //before the document is saved in the

//emedding user documents in tour documents. Not preferred, child referencing is more referred
// tourSchema.pre('save', async function (next) {
//     // returns promises which are stored in guidesPromises
//     const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

tourSchema.pre('save', (next) => {
    console.log('Will save document...');
    next();
});

tourSchema.post('save', (doc, next) => {
    console.log(doc);
    next();
});

//QUERY MIDDLEWARE. This is executed before a query is executed
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });

    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt',
    });

    next();
});

//here we will get access to all the documents returned from this query
tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);
    // console.log(docs);
    next();
});

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//     //as this obj is array, we add new element at beginning with unshift()
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//     console.log(this.pipeline());
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema); //'Tour' means collection 'tours' will
//be formed in the natours db.

module.exports = Tour;
