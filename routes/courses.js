const express = require('express');
const {
  getCourses,
  getCourse,
  addCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courses');

//=====Models=====
const Course = require('../models/Course');

//=====Middlewares=====
const { protect, authorize } = require('../middleware/auth'); // Our authenticating user middleware function
const advancedResults = require('../middleware/advancedResults');

//=====Express=====
const router = express.Router({ mergeParams: true }); // Preserve the req.params values from the parent router. If the parent and the child have conflicting param names, the child’s value take precedence.

/*
we create : const courseRouter = require('./courses'); inside bootcamps route
we attach the path to the router  router.use('/:bootcampId/courses', courseRouter);
in this example when a request in /api/v1/bootcamps/:bootcampId/courses it is processed inside the courses controller
*/

router
  .route('/')
  .get(
    advancedResults(Course, {
      path: 'bootcamp',
      select: 'name description',
    }),
    getCourses
  )
  .post(protect, authorize('publisher', 'admin'), addCourse);
router
  .route('/:id')
  .get(getCourse)
  .put(protect, authorize('publisher', 'admin'), updateCourse)
  .delete(protect, authorize('publisher', 'admin'), deleteCourse);

module.exports = router;
