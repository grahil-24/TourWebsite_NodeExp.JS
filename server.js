const mongoose = require('mongoose');

const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
    console.log(err.name, err.message);
    console.log('Uncaught Exception. Shutting Down');
    process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

//atlas hosted database
mongoose
    .connect(DB, {
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('DB connection successful');
    });
// .catch((err) => console.log(err));

// console.log(app.get('env'));
// console.log(process.env);

//4) START SERVER
//port number
const port = process.env.PORT || 3000;
//to start a server
const server = app.listen(port, () => {
    console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('Unhandled rejection. Shutting Down');
    server.close(() => {
        process.exit(1);
    });
});
