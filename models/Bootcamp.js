const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

const BootcampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please Add a name'],
      unique: true,
      trim: true, //Trim Whitespace
      maxlength: [50, 'Name can not be more than 50 characters'],
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Please Add a description'],
      maxlength: [500, 'Description can not be more than 50 characters'],
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)+@\w+([\.:]?\w+)+(\.[a-zA-Z0-9]{2,3})+$/,
        'Please add a valid email',
      ],
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/, //Regex for http or https website
        'Please use a valid URL with HTTP or HTTPS',
      ],
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
    location: {
      // GeoJSON Point
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    careers: {
      // Array of strings
      type: [String],
      required: true,
      enum: [
        //This are the only available values
        'Web Development',
        'Mobile Development',
        'UI/UX',
        'Data Science',
        'Business',
        'Other',
      ],
    },
    averageRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [10, 'Rating must can not be more than 10'],
    },
    averageCost: Number,
    photo: {
      type: String, //The name of the file
      default: 'no-photo.jpg', //if no photo show default
    },
    housing: {
      type: Boolean,
      default: false,
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGuarantee: {
      type: Boolean,
      default: false,
    },
    acceptGi: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    //   user: {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'User',
    //     required: true
    //   }
    // },
    // {
    //   toJSON: { virtuals: true },
    //   toObject: { virtuals: true }
    // }
  },
  {
    toJSON: { virtuals: true }, //Adding virtuals , which are a reference to an object or field in another schema
    toObject: { virtuals: true },
  }
);

// Create bootcamp slug from the name - for example the name is "ModernTech Bootcamp" , the slug will be "moderntech-bootcamp" -> it's good for creating links without a space
BootcampSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); // We have slug field , we assign it the value we will recieve from slugify function that recieves the name and parameters
  console.log('Slugify ran', this.name); // this reffers to the object of the Schema
  next();
});

// Geocode & create location field

BootcampSchema.pre('save', async function (next) {
  const loc = await geocoder.geocode(this.address);
  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode,
  };

  //Do not save address in db -> Once we used geocode we store the geocode data in the database and remove the user address input

  this.address = undefined;

  next();
});

// Cascade delete courses when a bootcamp is deleted
BootcampSchema.pre('remove', async function (next) {
  await this.model('Course').deleteMany({ bootcamp: this._id });
  next();
});

// Reverse populate with virtuals
BootcampSchema.virtual('courses', {
  ref: 'Course', // The referenced object
  localField: '_id', // the field that represents the data we want to see
  foreignField: 'bootcamp', //the field that contains localField from the other Object (in Course we have a field called bootcamp that contains bootcamp id)
  justOne: false,
});

module.exports = mongoose.model('Bootcamp', BootcampSchema);
