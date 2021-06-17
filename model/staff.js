const mongoose = require('mongoose');

const staffSchema = mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manager',
    },
    username: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    forgetPassHash: {
      type: String,
      default: null,
    },
    forgetPassCreatedAt: {
      type: String,
    },
    staffRole: {
      type: String,
      enum: ["staff", "captain", "crew"],
    },
    phone: {
      type: String,
    },
    nickName: {
      type: String,
    },
    vessels: [{
      vesselId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vessel',
       },
       documents: {
         type: Boolean,
         default: true,
       },
       reminderAndTasks: {
         type: Boolean,
         default: true,
       },
       costs: {
         type: Boolean,
         default: true,
       },
       crewList: {
         type: Boolean,
         default: true,
       },
       fuel: {
         type: Boolean,
         default: true,
       },
       dailyReport: {
         type: Boolean,
         default: true,
       },
    } ],
    placeOfBirth: {
      type: String,
    },
    dob: {
      type: String,
    },
    dateOfAssignment: {
      type: String,
    },
    nationality: {
     type: String,
    },
    title: {
      type: String,
    },
    documentId: {
      type: String,
    },
    citizenNo: {
      type: String,
    },
    licenseNo: {
      type: String,
    },
    image: {
      type: String,
    },
    reminder: {
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
          type: String
      }
  }
  },
  
  {
    timestamps: true,
  },
);

const Staff = mongoose.model('Staff', staffSchema);
module.exports = Staff;
