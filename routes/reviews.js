const express = require('express');
const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviews');

//=====Models=====
const Review = require('../models/Review');

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
    advancedResults(Review, {
      path: 'bootcamp',
      select: 'name description',
    }),
    getReviews
  )
  .post(protect, authorize('user', 'admin'), addReview);

router
  .route('/:id')
  .get(getReview)
  .put(protect, authorize('user', 'admin'), updateReview)
  .delete(protect, authorize('user', 'admin'), deleteReview);
module.exports = router;
