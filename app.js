const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit'); // eslint-disable-line
const helmet = require('helmet'); // eslint-disable-line
const mongoSanitize = require('express-mongo-sanitize'); // eslint-disable-line
const xss = require('xss-clean'); // eslint-disable-line
const hpp = require('hpp'); // eslint-disable-line
const cookieParser = require('cookie-parser'); // eslint-disable-line
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const viewRouter = require('./routes/viewRoutes');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

// setting pug as the template engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1) Global MIDDLEWARES
//middleware. modifies the incoming request data

//to serve static files
app.use(express.static(path.join(__dirname, 'public')));

//set security HTTP headers
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
                baseUri: ["'self'"],
                fontSrc: ["'self'", 'https:', 'data:'],
                scriptSrc: [
                    "'self'",
                    'https:',
                    'http:',
                    'blob:',
                    'https://*.mapbox.com',
                    'https://js.stripe.com',
                    'https://m.stripe.network',
                    'https://*.cloudflare.com',
                    'https://unpkg.com/',
                    'https://tile.openstreetmap.org',
                ],
                frameSrc: ["'self'", 'https://js.stripe.com'],
                objectSrc: ["'none'"],
                styleSrc: [
                    "'self'",
                    'https:',
                    "'unsafe-inline'",
                    'https://unpkg.com/',
                    'https://tile.openstreetmap.org',
                    'https://fonts.googleapis.com/',
                ],
                workerSrc: [
                    "'self'",
                    'data:',
                    'blob:',
                    'https://*.tiles.mapbox.com',
                    'https://api.mapbox.com',
                    'https://events.mapbox.com',
                    'https://m.stripe.network',
                ],
                childSrc: ["'self'", 'blob:'],
                imgSrc: ["'self'", 'data:', 'blob:'],
                formAction: ["'self'"],
                connectSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'data:',
                    'blob:',
                    'https://*.stripe.com',
                    'https://*.mapbox.com',
                    'https://*.cloudflare.com/',
                    'https://bundle.js:*',
                    'ws://127.0.0.1:*/',
                ],
                upgradeInsecureRequests: [],
            },
        },
    })
);

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

const limiter = rateLimit({
    // limits the number of request coming from a particular IP
    max: 100, // only 100 requests allowed in an hour
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, try again after an hour',
});
app.use('/api', limiter);

// to parse the data coming from html form
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// body parser, reading data from body into req.body. start express app
app.use(
    express.json({
        limit: '10kb', // body having size bigger than 10kb will not be accepted
    })
);
// parsing data from cookies
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());
// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
    hpp({
        whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'],
    })
);

//express passes next() function as the third argument
app.use((req, res, next) => {
    console.log('Hello from the middleware');
    //we have to call the next() function to finish the request-response cycle
    next();
});

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    // console.log(req.headers);
    next();
});

// app.use(express.json());

//3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
    // const err = new Error(`Can't find ${req.originalUrl} on this server`);
    // err.status = 'fail';
    // err.statusCode = 404;
    // next(err); //if we pass anything into next, then it is considered to be error, and error middleware is called
    next(new AppError(`Cant find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

// app.get('/api/v1/tours', getAllTours);

// //y is an optional parameter
// app.get('/api/v1/tours/:id', getTour);

// //to create a new tour
// app.post('/api/v1/tours', createTour);

// //to update property on an object we use patch, while to update an whole object we use put
// //patch is easier to use to update proporties of object
// app.patch('/api/v1/tours/:id', updateTour);

// app.delete('/api/v1/tours/:id', deleteTour);
