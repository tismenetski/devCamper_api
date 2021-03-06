const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan'); // 3rd party Middleware logger
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const path = require('path');

// Security
const mongoSanitize = require('express-mongo-sanitize'); // Protect Database from noSQL injections
const helmet = require('helmet'); // Security headers
const xss = require('xss-clean'); // Prevent XSS attacks
const hpp = require('hpp'); // Prevent Http request paramaters pollution
const rateLimit = require('express-rate-limit'); // Limit number of requests
const cors = require('cors'); // Cross origin site

//LOAD ENV VARS
dotenv.config({ path: './config/config.env' });

//Connect to database
connectDB();

//Route files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

const app = express();

//Body parser -> using this line we can send raw JSON data and interpete it in our requests
app.use(express.json());

//Cookie parser
app.use(cookieParser());

// Dev logging middleware

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File uploading
app.use(fileupload());

// Sanitize database
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100,
});

app.use(limiter);

// Prevent http param pollution

app.use(hpp());

// Enable CORS
app.use(cors()); // For example if we upload the backend to one domain and the frontend to different domain we will still be able to use our api

// Set static folder
app.use(express.static(path.join(__dirname, 'public'))); //Setting public as a static folder

//Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

app.use(errorHandler); //Declaring app.use errorhandler is required after announcing use of api since it won't work if we declare it before the api

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

//Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  //Close server & exit process
  server.close(() => process.exit(1));
});
