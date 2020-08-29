const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a title for the review'],
    maxlength: 100,
  },
  text: {
    type: String,
    required: [true, 'Please add some text'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, 'Please add a rating between 1 and 10'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bootcamp',
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
});

ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true }); //User allowed to create 1 review per bootcamp

// Static method to get avg of rating and save
ReviewSchema.statics.getAverageRating = async function (bootcampId) {
  const obj = await this.aggregate([
    //This is an aggregation - part of mongoose schema methods, it takes several fields from the schema object and uses them for aggregation
    {
      $match: { bootcamp: bootcampId }, //match fields where the bootcamp equals the bootcamp id
    },
    {
      $group: {
        //By which group we are aggregating and the field where the calculation will take place, in this example we add averageRating as a field and then we use $avg method on the rating value
        _id: '$bootcamp',
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
      //update the model with the result of the average rating in the obj we created above
      averageRating: obj[0].averageRating,
    });
  } catch (error) {
    console.error(error);
  }
};

// Call getAverageRating after save --> everytime we update our data we recalculate the average

ReviewSchema.post('save', function () {
  this.constructor.getAverageRating(this.bootcamp);
});

// Call getAverageRating before remove

ReviewSchema.pre('remove', function () {
  this.constructor.getAverageRating(this.bootcamp);
});

module.exports = mongoose.model('Review', ReviewSchema);
