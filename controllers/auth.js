const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const sendEmail = require('../utils/sendemail');
const sendemail = require('../utils/sendemail');
const crypto = require('crypto');

//@desc Register user
//@route POST /api/v1/auth/register
//@access Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  //Create user

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  sendTokenResponse(user, 200, res);
});

//@desc Login user
//@route POST /api/v1/auth/login
//@access Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //Validate email and password

  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  //Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches using a custom method we created inside the User Schema
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

//@desc Log user out / clear cookie
//@route GET /api/v1/auth/logout
//@access Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, data: {} });
});

//@desc Get current logged in user
//@route GET /api/v1/auth/me
//@access Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  //const user = req.user;

  res.status(200).json({ success: true, data: user });
});

//@desc Update user details
//@route PUT /api/v1/auth/updatedetails
//@access Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    // we pass this as object to the user with the fields we would like to update
    name: req.body.name,
    email: req.body.email,
  };
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  }); // findByIdAndUpdate -  first param - the id ,second param - what to update

  res.status(200).json({ success: true, data: user });
});

//@desc Get update password
//@route POST /api/v1/auth/updatepassword
//@access Private
exports.updatepassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password'); // by default the password is not included when requesting a user , but this is the way to attach it to the request

  //Check current password ->make sure the password in user is the same as the password in the request body field currentpassword
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  //Set the password from the request body to the user password
  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

//@desc Forgot password
//@route POST /api/v1/auth/forgotpassword
//@access Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with this email', 404));
  }

  //Get reset Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${resetToken}`; //req.protocol-Contains the request protocol string: either http or (for TLS requests) https.  req.get('host') -- determines the host ,either localhost or deployed

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password.Please make a PUT request to \n\n ${resetUrl}`;

  try {
    await sendemail({
      email: user.email,
      subject: 'Password reset token',
      message,
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }

  console.log(resetToken);

  res.status(200).json({ success: true, data: user });
});

//@desc Reset password
//@route PUT /api/v1/auth/resetpassword/:resettoken
//@access Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  //Get hashed token

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken, // the field matches the variable resetPasswordToken(the variable and field name is the same , same as resetPasswordToken: resetPasswordToken )
    resetPasswordExpire: { $gt: Date.now() }, //$the value of resetPasswordExpire is greater than current date (token not expired)
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  //Set new Password
  user.password = req.body.password;

  //Remove fields related to reset password in the user
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save(); //save the user after the changes

  sendTokenResponse(user, 200, res); // After password reset we send back a token
});

// Get token from model, create cookie and send response -> this function replaces repetitive code in both register and login functions
const sendTokenResponse = (user, statusCode, res) => {
  //Create token
  const token = user.getSignedJwtToken(); // getSignedJwtToken - > a custom method inside the User Schema

  //create options object to send to the cookie , expiration date
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ), // 30 days
    httpOnly: true,
  };

  //By default we disabled https secure. this statement allows https in production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token });
};
