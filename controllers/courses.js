const Course = require('../models/Course');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Bootcamp = require('../models/Bootcamp');

//@desc Get courses
//@route GET /api/v1/courses
//@route GET /api/v1/bootcamps/:bootcampId/courses
//@access Public

exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    //if a bootcamp id attached , find the specific id and return the courses related to the bootcamp
    console.log('request came from bootcamps');
    const courses = await Course.find({ bootcamp: req.params.bootcampId });

    return res
      .status(200)
      .json({ success: true, count: courses.length, data: courses });
  } else {
    // no bootcamp id parameter, return all the courses with pagination ,limit and ect...
    res.status(200).json(res.advancedResults); //this calls the advanced results function that in turn sends back the respnose,and then this function returns the status with the data
  }
});

//@desc Get single course
//@route GET /api/v1/courses/:id
//@access Public

exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  });

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`),
      404
    );
  }

  res.status(200).json({ success: true, data: course });
});

//@desc ADD single course
//@route POST /api/v1/bootcamps/:bootcampId/courses
//@access Private

exports.addCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId; //We assign the req.body the value of the bootcampId ,so that our new posted object will already contain a bootcamp value
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`),
      404
    );
  }

  //Make sure user is bootcamp owner and also not an admin -> logic is only the user who created the bootcamp OR the admin can delete the bootcamp,in any other case we send error
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to create a course to bootcamp ${bootcamp._id}`,
        401
      )
    );
  }

  const course = await Course.create(req.body); // include everything sent from the body , including the bootcamp id

  res.status(200).json({ success: true, data: course });
});

//@desc Update course
//@route PUT /api/v1/courses/:id
//@access Private

exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id); //Find the course

  if (!course) {
    //If not found return error
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`),
      404
    );
  }
  //Make sure user is course owner and also not an admin -> logic is only the user who created the course OR the admin can update the course,in any other case we send error
  if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this course ${course._id}`,
        401
      )
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    //course found - update with new sent data and validate ,return the new object after update
    new: true,
    runValidators: true,
  }); // include everything sent from the body , including the bootcamp id

  res.status(200).json({ success: true, data: course });
});

//@desc Delete course
//@route DELETE /api/v1/courses/:id
//@access Private

exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id); //Find the course

  if (!course) {
    //If not found return error
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`),
      404
    );
  }

  //Make sure user is course owner and also not an admin -> logic is only the user who created the course OR the admin can delete the course,in any other case we send error
  if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this course ${course._id}`,
        401
      )
    );
  }

  await course.remove();

  res.status(200).json({ success: true, data: {} });
});
