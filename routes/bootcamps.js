const express = require('express');
const {
  getBootcamp,
  getBootcamps,
  createBootcamp,
  deleteBootcamp,
  updateBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require('../controllers/bootcamps');

//=====Models=====
const Bootcamp = require('../models/Bootcamp');

//=====Middlewares=====
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth'); // Our authenticating user middleware function

// Include other resource routers

const courseRouter = require('./courses');
const reviewRouter = require('./reviews');

const router = express.Router();

//Re-route into other resource routers

router.use('/:bootcampId/courses', courseRouter); //If the request have /:bootcampId/courses we will pass it on to the courseRouter
router.use('/:bootcampId/reviews', reviewRouter); //If the request have /:bootcampId/reviews we will pass it on to the reviewRouter

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

router
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
  .post(protect, authorize('publisher', 'admin'), createBootcamp);

router
  .route('/:id')
  .get(getBootcamp)
  .put(protect, authorize('publisher', 'admin'), updateBootcamp)
  .delete(protect, authorize('publisher', 'admin'), deleteBootcamp); //All the request coming to this path with id

router
  .route('/:id/photo')
  .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload); // protect = make sure that the user is authenticated when trying to access the path   authorize = make sure the user role is pemitted inside this path

module.exports = router;
