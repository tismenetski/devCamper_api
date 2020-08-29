// @desc Logs request to console
const logger = (req, res, next) => {
  //Whenever you call a middleware function you always need to call 'next' so it knows it can move to the next function in turn
  req.hello = 'Hello World';
  console.log(
    `${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`
  );
  next();
};

module.exports = logger;
