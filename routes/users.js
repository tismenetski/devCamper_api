const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  deleteUser,
  updateUser,
} = require('../controllers/users');

//=====Models=====
const User = require('../models/User');

//=====Middlewares=====
const { protect, authorize } = require('../middleware/auth'); // Our authenticating user middleware function
const advancedResults = require('../middleware/advancedResults');

//=====Express=====
const router = express.Router({ mergeParams: true }); // Preserve the req.params values from the parent router. If the parent and the child have conflicting param names, the child’s value take precedence.

router.use(protect); // Anything below this line will automatically use the protect function
router.use(authorize('admin')); // Anything below this line will automatically use the protect function
router.route('/').get(advancedResults(User), getUsers).post(createUser);

router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
