const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

//Load env vars

dotenv.config({ path: './config/config.env' });

const Bootcamp = require('./models/Bootcamp');

const Course = require('./models/Course');

const User = require('./models/User');

const Review = require('./models/Review');

//Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

//Read JSON Files

//Bootcamps
const bootcamps = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/bootcamps.json`, 'utf-8')
);

//Courses
const courses = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/courses.json`, 'utf-8')
);

//Users
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8')
);

//Reviews
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/reviews.json`, 'utf-8')
);

//Import into DB

const importData = async () => {
  try {
    await Bootcamp.create(bootcamps);
    await Course.create(courses);
    await User.create(users);
    await Review.create(reviews);

    console.log('Data imported...');
    process.exit();
  } catch (error) {
    console.error(error);
  }
};

//Delete Data

const deleteData = async () => {
  try {
    await Bootcamp.deleteMany(); //Delete all of them
    await Course.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('Data destroyed...');
    process.exit();
  } catch (error) {
    console.error(error);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
}
