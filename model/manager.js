const mongoose = require('mongoose');
const devicesSchema = new mongoose.Schema({
  deviceType: {
    type: String,
    trim: true,
  },
  deviceId: {
    type: String,
    trim: true,
  },
  token: {
    type: String,
    trim: true,
  },
});
const managerSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    companyName: {
      type: String,
    },
    forgetPassHash: {
      type: String,
      default: null,
    },
    forgetPassCreatedAt: {
      type: String,
    },
    otp: {
      type: String,
    },
    coordinates: {
      lat: {
        type: Number,
        default: 0,
      },
      lng: {
        type: Number,
        default: 0,
      },
    },
    staff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'staff',
      },
    ],
    vessel: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vessel',
      },
    ],
    address: 
      {
        address: {
          type: String,
        },
        country: {
          type: String,
        },
        city: {
          type: String,
        },
        state: {
          type: String,
        },
        zipcode: {
          type: String,
        },
      },
    image: {
      type: String,
    },
    phone: {
      type: String,
    },
    phoneCode: {
      type: String,
    },
   
    isVerified: {
      type: Boolean,
      default: false,
    },
    isUserBlocked: {
      type: Boolean,
      default: false,
    },
    devices: devicesSchema,
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'notification',
      },
    ],
    reminder: [  { 
      title: {
        type: String,
      },
      date: {
        type: String,
      },
      time: {
        type: String,
      },
      message: {
        type: String,
      },
      status: {
        type: Boolean,
        default: false,
      },}
    ],
  },
  {
    timestamps: true,
  },
);

const Manager = mongoose.model('Manager', managerSchema);
module.exports = Manager;
