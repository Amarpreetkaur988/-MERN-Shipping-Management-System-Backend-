const passwordHash = require("password-hash");
const jwt = require("jsonwebtoken");
const winston = require("winston");
const mongoose = require("mongoose");
const fs = require("fs");
const axios = require("axios");
const fetch = require('node-fetch');
const moment = require("moment");
const Manager = require("../model/manager");
const Staff = require("../model/staff");
const Vessel = require("../model/vessel");
const keys = require("../config/keys");
const notificationTypes = require("../common/notificationTypes");
const sendMail = require("../common/sendMail");
const Reminder = require("../model/reminder")
const Stripe = require('stripe');
const Subscription = require('../model/subscriptions')
// const Payment = require("../model/payment");
const {returnCron} = require("../cronjobs/cron");
const { time } = require("console");
const Plan = require("../model/plans");
const Category = require("../model/category");
const stripe = Stripe('sk_test_51IRBTLJMwyQTuC221vHBfVPJmwJGrgJX2xXyuGtehBtGtJbgYzLl35q3ZsIbV4jtM5NCsKWxQxHXgNW0imrItNH500RSgCUCN9');

exports.login = async (req, res) => {
  try {
    const {
      email,
      password,
      lat,
      lng,
      deviceId,
      deviceType,
      deviceToken,
    } = req.body;

    console.log("reqweeqw", req.body)
     
    if (!email) {
      return res
        .status(404)
        .json({ error: "Email is required" });
    }
    let user;
    if (email) {
       user = await Manager.findOne({
       email
      });
     
    if (!user) return res.status(404).json({ error: "Email not found" });

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ error: "Sorry, Your account is not verified!" });
    }
      if (user.isUserBlocked) {
        return res
          .status(400)
          .json({ error: "Sorry, Your account is suspended." });
      }
    }

    const verifyPassword = passwordHash.verify(
      password,
      user.password
    );
    
    if (!verifyPassword)
      return res.status(403).json({ error: "Invalid Password" });

    const payload = {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    };

    let jwtoken = jwt.sign(payload, keys.secretOrKey, { expiresIn: 31556926 });

    user.coordinates = {
      lat,
      lng,
    };

    user.devices = {
      deviceId,
      deviceType,
      token: deviceToken,
    };
    await user.save();

    return res.status(200).json({
      success: true,
      msg: "Logged In",
      data: { token: jwtoken, user },
    });
  } catch (error) {
    winston.error(error);
  }
};

exports.signup = async (req, res) => {
  try {
    // check existing email
    const { companyName, email, firstName, lastName, password } = req.body;
    // console.log("req.body==", req.body)
    let check_email = await Manager.findOne({email: email.toLowerCase()});
  
    if (check_email)
      return res.status(400).json({ error: "Email is already registered" });
 
      const hashedPassword = passwordHash.generate(password);
     // console.log("req.files.image[0]", req.files.image)
      //const image1 =  req.files.image && req.files.image[0].path;
      const otp = Math.floor(1000 + Math.random() * 9000);
     let new_user = new Manager({
        firstName,
        lastName,
        companyName,
        email: email.toLowerCase(),
        password: hashedPassword,
        accountType: "manager",
        otp,
        image: keys.apiURL + "default.png",
       },
     );

    const payload = {
      id: new_user._id,
      name: `${new_user.firstName}${new_user.lastName}`,
    };

    let token = jwt.sign(payload, keys.secretOrKey, { expiresIn: 31556926 });

    const save = await new_user.save();
    const subject = "Email Authentication";
    const text =  "Your otp is "+ otp;
    await sendMail(email, subject, text);
    return res.status(200).json({
      success: true,
      msg: "Details saved",
      data: { user: save, token },
    });
  } catch (error) {
    winston.error(error);
  }
};

exports.editProfile = async (req, res) => {
  try {
    // check existing email
    console.log("req.body", req.body)
    const { companyName, firstName, lastName, id, phoneNumber } = req.body;
    const managerId = id ? id : req.data.id
    let check_manager = await Manager.findOne({_id: managerId});
  
    if (!check_manager)
      return res.status(400).json({ error: "User not exists" });
     
      check_manager.companyName = companyName;
      check_manager.firstName = firstName;
      check_manager.lastName = lastName;
      check_manager.phone = phoneNumber || check_manager.phone;
      check_manager.image = req.files && 
      req.files.image && 
      keys.apiURL + req.files.image[0].filename || keys.apiURL + "default.png";
    check_manager.save()
    return res.status(200).json({
      success: true,
      msg: "Your profile has been successfully updated",
      data: { user: check_manager },
    });
  } catch (error) {
    winston.error(error);
  }
};

exports.otpVerification = async (req, res, next) => {
  try {
    const isUser = await Manager
      .findById({_id: req.body.managerId})
      .exec();

    if (!isUser) {
      return next(new Error("user does not exist"));
    }

    if (isUser.isVerified) {
      return next(new Error("Already Verified"));
    }

    if (isUser.otp == req.body.otp) {
      isUser.isVerified = true;
      await isUser.save();

      var userdata = await Manager
        .findOne({ _id: isUser._id })
        .exec();

        const payload = {
          id: userdata._id,
          name: `${userdata.firstName} ${userdata.lastName}`,
          email: userdata.email,
        };
    
        let jwtoken = jwt.sign(payload, keys.secretOrKey, { expiresIn: 31556926 });

      return res.status(200).json({
        status: true,
        data: { token: jwtoken, userdata },
        msg: "You are now a verified user",
      });
    } else {
      return next(new Error("OTP not matched..Please enter valid otp"));
    }
  } catch (error) {
    return next(error);
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const manager = await Manager.findOne({ email });
    if (!manager) return res.status(404).json({ error: "User not found" });

    const otp = Math.floor(1000 + Math.random() * 9000);

    manager.otp = otp;
    await manager.save();
    const subject = "Email Authentication";
    const text =  "Your otp is "+ otp;
    await sendMail(email, subject, text);

    return res
      .status(200)
      .json({ success: true, msg: "OTP sent", data: {managerId: manager._id} });
  } catch (error) {
    winston.error(error);
  }
};
//Manager Profile -------------------------
exports.getProfile = async (req, res) => {
  try {
    const managerId = req.body.manager_id || req.data.id;
    console.log("manager id",)
    const manager = await Manager.findOne({_id: managerId});
    const staff = await Staff.find({managerId})
    const vessel =await Vessel.find({managerId})
    console.log("manager======>", manager)
    if (!manager) return res.status(404).json({ error: "Manager not found" });
    return res.status(200).json({
      success: true,
      data: { manager, staff, vessel },
    });
  } catch (error) {
    winston.error(error);
  }
};

exports.addStaff = async (req, res) => {
  try {
    console.log("image", req.files)
      const {
        username,
        email,
        staffRole,
        phone,
        nickName,
        vessels,
        placeOfBirth,
        dob,
        dateOfAssignment,
        nationality,
        title,
        documentId,
        citizenNo,
        licenseNo,
        reminder,
      } = req.body;
console.log("req.body", req.body)

    console.log("req.data.id,", req.data.id)
    const manager = await Manager.findOne({_id: req.data.id});
    if (!manager) return res.status(404).json({ error: "Manager not found" });

      const newStaff = new Staff({
        managerId: req.data.id,
        username,
        email,
        staffRole,
        phone,
        nickName,
        vessels: JSON.parse(vessels),
        placeOfBirth,
        dob,
        dateOfAssignment,
        nationality,
        title,
        documentId,
        citizenNo,
        licenseNo,
        reminder: JSON.parse(reminder),
        image: req.files && req.files.image && keys.apiURL + req.files.image[0].filename || keys.apiURL + "default.png",
      });
      const staffAdded = await newStaff.save();
      
      await Manager.updateOne(
        { _id: req.data.id },
        { $push: { staff: staffAdded._id } },
      );

    return res.status(200).json({
      success: true,
      msg: "Details saved",
      data: { user: staffAdded },
    });
  } catch (error) {
    winston.error(error);
  }
};

exports.getStaffs = async (req, res) => {
  try {
    
    const all_staffs = await Staff.find({managerId: req.data.id}, {'staffRole':1, '_id':1, 'image':1,'nickName': 1, 'username': 1});
    if(!all_staffs) return res.status(404).json({msg: 'No staff found'})

    return res.status(200).json({
      success: true,
      data: { all_staffs },
    });
  } catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getStaffDetail = async (req, res) => {
  try {
    const { staffId } = req.params;
    const staff = await Staff.findOne({managerId: req.data.id, 
    _id: staffId}).populate({
      path: 'vessels.vesselId', 
    //  select:{vesselName: 1, image: 1}
     }
      );
    if(!staff) return res.status(404).json({msg: 'Staff not found'})

    return res.status(200).json({
      success: true,
      data: { staff },
    });
  } catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    console.log("resfsdf", req.body)
    const staff = await Staff.findOne({
     managerId: req.data.id , _id: req.body.staffId
    });
    console.log("staff", staff)
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    staff.username = req.body.username || '';
    staff.email = req.body.email;
    staff.staffRole = req.body.staffRole;
    staff.phone = req.body.phone;
    staff.nickName = req.body.nickName;
    staff.vessels = JSON.parse(req.body.vessels);
    staff.placeOfBirth = req.body.placeOfBirth;
    staff.dob = req.body.dob;
    staff.dateOfAssignment = req.body.dateOfAssignment;
    staff.nationality = req.body.nationality;
    staff.title = req.body.title;
    staff.documentId = req.body.documentId;
    staff.citizenNo = req.body.citizenNo;
    staff.licenseNo = req.body.licenseNo;
    staff.reminder = JSON.parse(req.body.reminder);
    staff.image = req.files && req.files.image && keys.apiURL + req.files.image[0].filename || staff.image;
    const updated = await staff.save();
    return res.status(200).json({msg: "saved", data: {updated}})

  } catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try{
    console.log("req.body", req.body)
    await Staff.findByIdAndDelete(
      { _id: req.body.staffId, managerId: req.data.id },
    );
    return res.status(200).json({
      success: true,
    });
  }
  catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message});
  }
}

exports.addVessel = async (req, res) => {
  try {
      const {
        vesselName,
        captain,
        vesselType,
        yearOfManufacture,
        imoNo,
        engine,
        flag, 
        deadWeight,
        vesselClass,
        portOfRegistry
      } = req.body;
      console.log("reminder", req.body)
      const newVessel = new Vessel({
        managerId: req.data.id,
        vesselName,
        captain,
        vesselType,
        yearOfManufacture,
        imoNo,
        engine,
        flag, 
        deadWeight,
        vesselClass,
        portOfRegistry,
        engine: JSON.parse(engine),
      });
      const vesselAdded = await newVessel.save();
      await Manager.updateOne(
        { _id: req.data.id },
        { $push: { vessel: vesselAdded._id } },
      );

    return res.status(200).json({
      success: true,
      msg: "Details saved",
      data: { vessel: vesselAdded },
    });
  } catch (error) {
    winston.error(error);
  }
};

exports.getVessels = async (req, res) => {
  try {
    console.log("guygkuy")
    const all_vessels = await Vessel.find({managerId: req.data.id}, 
      { '_id': 1,'managerId':1, 'imoNo': 1, 'image':1, 'createdAt':1,'updatedAt':1, 'vesselName':1, 'country':1, 'range':1, 'registrationNo':1});
    if(!all_vessels) return res.status(404).json({msg: 'No vessel found'})

    return res.status(200).json({
      success: true,
      data: { all_vessels },
    });
  } catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getVesselDetail = async (req, res) => {
  try {
    const { vesselId } = req.params;
    const vessel = await Vessel.findOne({managerId: req.data.id, 
    _id: vesselId}, { 'createdAt': 1, 
    'deadWeight': 1, 
    'captain': 1,
    'engine': 1, 
    'flag': 1, 
    '_id': 1, 
    'imoNo': 1,
    'managerId': 1,
    'portOfRegistry': 1,
    'updatedAt': 1,
    'vesselName': 1,
    'vesselType': 1,
    'yearOfManufacture': 1,
    '_v': 1,
  }).populate({path: 'captainId'});
   console.log("vessel", vessel)
    if(!vessel) return res.status(404).json({msg: 'Vessel not found'})

    return res.status(200).json({
      success: true,
      data: { vessel },
    });
  } catch (error) {
    winston.error(error);
    console.log("erooror", error)
    return res.status(500).json({ error: error.message });
  }
};

exports.updateVessel = async (req, res) => {
  try {
    console.log("update vesseeel", req.body)

    const vessel = await Vessel.findOne({
      _id: req.params.vesselId, managerId: req.data.id 
    });
    if (!vessel) return res.status(404).json({ error: "Vessel not found" });
    vessel.vesselName = req.body.vesselName;
    vessel.captain = req.body.captain;
    vessel.vesselType = req.body.vesselType;
    vessel.yearOfManufacture = req.body.yearOfManufacture;
    vessel.imoNo= req.body.imoNo;
    vessel.portOfRegistry = req.body.portOfRegistry;
    vessel.flag = req.body.flag;
    vessel.vesselClass = req.body.vesselClass;
    vessel.deadWeight = req.body.deadWeight;
    vessel.engine = JSON.parse(req.body.engine);
    
    const save = await vessel.save();
    console.log("save =====", save)
    return res.status(200).json({
      success: true,
      data: { updateData: save },
    });
  } catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteVessel = async (req, res) => {
  try {
    await Vessel.findByIdAndDelete(
      { _id: req.body.vesselId, managerId: req.data.id },
    );
    return res.status(200).json({
      success: true,
    });
  }
  catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message});
  }
}

exports.getAllManager = async (req, res) => {
  try {
    const pageLimit = parseInt(req.params.pageLimit);
    const page = parseInt(req.params.pageNumber);

     const managers = await Manager.find({})
        .limit(pageLimit)
        .skip(pageLimit * (page - 1))
        .sort({ created_at: -1 })
        .exec();
        const all_manager = await Manager.find({}).countDocuments();
      return res
      .status(200)
      .json({ success: true, data: { managers, all_manager } });

  } catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message });
  }
}

exports.addBooking = async (req, res) => {
  try {
    // let isFeePaid = false;
    const bookingId = generateOTP(8);
    console.log("bookingid geeerates", bookingId)
    const owner = await Owner.findOne({_id: req.data.id});
    if (!owner) return res.status(404).json({ error: "Owner not found" });
    const walker = await Walker.findOne({_id: req.body.walkerId});
    if (!walker) return res.status(404).json({ error: "Walker not found" });
    
    //Payment
    // const transfer = await stripe.transfers.create({
    //   amount: 400,
    //   currency: req.body.currency,
    //   destination: req.body.accountId,
    //   transfer_group: 'ORDER_95',
    // });
    // console.log("transfer ==>", transfer)

    const bookingDetails = new Booking({
      bookingId,
      ownerId: req.data.id,
      walkerId: req.body.walkerId,
      dogId: req.body.dogId,
      duration: req.body.duration,
      date: moment(req.body.date).format("MMM DD, YYYY"),
      time: req.body.time_slot,

      // isFeePaid: req.body.isFeePaid,
      status: "pending",
    });

    const save = await bookingDetails.save();
    // send notification to walker

    let notification_data = {
      name: `${walker.basicInfo.fullName}`,
      date: moment(req.body.date).format("MMM DD, YYYY"),
      time: req.body.time_slot,
    };

    let { title, body } = notificationTypes.addBooking(
      notification_data
    );

    let data = {
      senderId: req.data.id,
      receiverId: req.body.walkerId,
      notificationSendTo: "walker",
      title,
      body,
    };
    sendNotification(data);
    return res.status(200).json({
      success: true,
      msg: "Service Booked",
      data: { details: save },
    });
  } catch (error) {
    winston.error(error);
  }
};

exports.addReminderToManager = async(req, res) => {
  try {
    const { title, date, time, message, status } = req.body;
    console.log("req.body====", req.body)
    const reminder = {
      title,
      date,
      time,
      status,
    };
    let save;
    const isExists = await Manager.findById({ _id: req.data.id });
    if (!isExists) return res.status(404).json({ error: "Manager not found" });

    isExists.reminders.push(reminder);

    save = await isExists.save();

    if (status === true) {
      const getMinutes = time.split(":")[1];
      const getHours = time.split(":")[0];

      cron.schedule(`* ${getMinutes} ${getHours} * * *`, () => {
        console.log("running a task according to above schedule");

        let data = {
          receiverId: req.body.id,
          notificationSendTo: "manager",
          title: "Reminder",
          body: message,
        };

        sendNotification(data);
      });
    }
  console.log("save afer", after)
    return res.status(200).json({
      success: true,
      msg: "Reminders added",
      data: { save },
    });
  } catch (error) {
    winston.error(error);
  }
}

exports.payFee = async (req, res) => {
 try {
      //credit amount to admin------------------------------
    const { paymentAmount, bookingId, currency, accountId } = req.body;
    const transfer = await stripe.transfers.create({
      amount: walkerCommission,
      currency: currency,
      destination: accountId,
      transfer_group: 'ORDER_95',
    });

    if(transfer) {
      const addPayment = new Payment({
        paymentAmount,
        bookingId,
        paymentByOwner: req.body.paymentBy,
        paymentStatus: 'Successfull',
        paidBy: 'owner'
      });
      await addPayment.save();
     }

    const booking = await Booking.findOne({_id: bookingId}).populated({
      path: 'ownerId'
    });
    booking.isFeePaid = true;
    booking.save();
    //send notification to walker that owner confirms the booking you accepted

    let notification_data = {
      name: `${booking.owner.basicInfo.fullName}`,
      date: moment(booking.date).format("MMM DD, YYYY"),
      time: booking.time,
    };

    let { title, body } = notificationTypes.confirmBookingByOwner(
      notification_data
    );

    let data = {
      senderId: req.data.id,
      receiverId: booking.walkerId,
      notificationSendTo: "walker",
      title,
      body,
    };

    sendNotification(data);
    return res.status(200).json({
      success: true, 
      msg: 'successfull'
    })
 }
catch (error) {
  winston.error(error);
}
};

exports.getPayments = async (req, res) => {
try{
 const paymentDetails = await Payment.find({});

 

}
catch (error) {
  winston.error(error);
}

};

exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId, reason, walkerId } = req.body;
    const booking = await Booking.findOne({bookingId, walkerId, ownerId: req.data.id})
    .populate({path: 'walkerId'}).populate({path: 'ownerId'})
    if (!booking)
      return res.status(404).json({ error: "No booking(s) found" });
      console.log(booking)

      const createdDate = new Date(booking.created_at);
      const timeStamp = Math.round(new Date().getTime() / 1000);
      const timeStampYesterday = timeStamp - (24 * 3600);
      const is24 = createdDate >= new Date(timeStampYesterday*1000).getTime();
      console.log(is24);
      if(!is24)
      return res.status(404).json({ error: "sorry you are not eligible for the refund" });

      if(booking.status === 'start')
      return res.status(404).json({ error: "sorry you can't cancel this booking as it is started" });
  
     await Booking.updateOne(
      {bookingId}, 
      {status: 'cancelled', 
      'isBookingCancelled.value': true,
      'isBookingCancelled.cancellationReason': reason,
      'isBookingCancelled.cancelBy':req.data.id,
     })

    // send notification to walker

    let notification_data = {
      name: `${booking.user.fullName}`,
      date: moment(booking.date).format("MMM DD, YYYY"),
      time: booking.time,
    };

    let { title, body } = notificationTypes.appointmentCancel(
      notification_data
    );

    let data = {
      senderId: req.data.id,
      receiverId: walkerId,
      notificationSendTo: "walker",
      title,
      body,
    };

    sendNotification(data);

    return res.status(200).json({
      success: true,
      msg: "Booking Cancelled",
    });
  } catch (error) {
    winston.error(error);
  }
};

//Stripe Setup---------------------------------------------------------------------------
exports.createTransfer = async (req, res) => {
  try{
    const transfer = await stripe.transfers.create({
      amount: 400,
      currency: req.body.currency,
      destination: req.body.accountId,
      transfer_group: 'ORDER_95',
    });
  
    const refund = await stripe.refunds.create({
      charge: 'ch_1IShaYJMwyQTuC22hA4FJqNz',
    });
  }
  catch (error) {
    winston.error(error);
  }
}


//Add Documents to vessel
exports.testDocument = async(req, res) => {
  try{
   const { vesselId, title, category, note, expiryDate, doesDocumentExpire, remindMe , time  } = req.body;
  //  const vessel = await Vessel.findOne({_id:vesselId});
  //  console.log("req.body of add document", req.body)
  //  if(!vessel) return res.status(404).json({error: 'Vessel not found'});
  console.log("firstReminderDate", req.data.id)
   const firstReminderDate = moment(new Date(expiryDate), "DD-MM-YYYY" ).subtract(2 , 'days');


   const firstReminder = new Reminder({
    managerId: req.data.id,
    vesselId,
    title: 'Document Expire',
    date: moment(firstReminderDate).format("DD-MM-YY"),
    time,
    message:`Your document going to expire on ${expiryDate}`,
  });
  const savedFirstReminder = await firstReminder.save();
  console.log("savedFirstReminder", savedFirstReminder)
   const secondReminder = new Reminder({
    managerId: req.data.id,
    vesselId,
    title: 'Document Expire',
    date: expiryDate ,
    time,
    message:`Your document has expired on ${expiryDate}`,
  });
console.log("firstReminderDate, expiry date", firstReminderDate, expiryDate)
  // const savedFirstReminder = await firstReminder.save();
  const savedSecondReminder = await secondReminder.save();

  console.log("savedFirstReminder.date, savedSecondReminder.date", savedFirstReminder.date, savedSecondReminder.date)
  returnCron(req.data.id, vesselId, savedFirstReminder._id, moment(savedFirstReminder.date, "DD-MM-YYYY"), savedFirstReminder.time)
  returnCron(req.data.id, vesselId, savedSecondReminder._id, moment(savedSecondReminder.date, "DD-MM-YYYY"), savedSecondReminder.time)

console.log("CONSOLE AFTER RETURN CRONE")
  //  const image = req.files && req.files.image && keys.apiURL + req.files.image[0].filename || keys.apiURL + "default.png";
  //  const document = req.files && req.files.document && keys.apiURL + req.files.document[0].filename || keys.apiURL + "default.png";

  //  const newDocument =  { title, category, note,  image, document, remindMeBefore:  remindMe };
  //  const updateVessel = await Vessel.updateOne(
  //    {_id: vesselId},
  //    {$push:
  //    {'documents': newDocument
  //    } })
  //    console.log("update vesdsefef", updateVessel)
    if(updateVessel)
    return res.status(200).json({
      success: true,
      msg: 'Documents added successfully'
    });
  }
  catch (error) {
    winston.error(error);
  }
};

//Add Documents to vessel
exports.addDocument = async(req, res) => {
  try{

    console.log("req.files", req.files)
   const { vesselId, title, category, note, expiryDate, doesDocumentExpire, remindMe , time  } = req.body;
   const vessel = await Vessel.findOne({_id:vesselId});
   console.log("req.body of add document", req.body)
   if(!vessel) return res.status(404).json({error: 'Vessel not found'});
   if(expiryDate){
   const firstReminderDate = moment(new Date(expiryDate), "DD-MM-YYYY" ).subtract(2 , 'days');
   const firstReminder = new Reminder({
    managerId: req.data.id,
    vesselId,
    title: 'Document Expire',
    date: moment(firstReminderDate).format("DD-MM-YY"),
    time: '23:59',
    message:`Your document going to expire on ${expiryDate}`,
  });
  const savedFirstReminder = await firstReminder.save();
  console.log("savedFirstReminder", savedFirstReminder)
   const secondReminder = new Reminder({
    managerId: req.data.id,
    vesselId,
    title: 'Document Expire',
    date: expiryDate ,
    time: '23:59',
    message:`Your document has expired on ${expiryDate}`,
  });
 console.log("firstReminderDate, expiry date", firstReminderDate, expiryDate)
  // const savedFirstReminder = await firstReminder.save();
  const savedSecondReminder = await secondReminder.save();

  console.log("savedFirstReminder.date, savedSecondReminder.date", savedFirstReminder.date, savedSecondReminder.date)
  returnCron(req.data.id, vesselId, savedFirstReminder._id, moment(savedFirstReminder.date, "DD-MM-YYYY"), savedFirstReminder.time)
  returnCron(req.data.id, vesselId, savedSecondReminder._id, moment(savedSecondReminder.date, "DD-MM-YYYY"), savedSecondReminder.time)
   }
   const image = req.files && req.files.image ? keys.apiURL + req.files.image[0].filename : '';
   const document = req.files && req.files.document ? keys.apiURL + req.files.document[0].filename: '' ;
   console.log("image. document", image, document)
   const newDocument =  { title, category, note, image, document, remindMeBefore:  remindMe };
   const updateVessel = await Vessel.updateOne(
     {_id: vesselId},
     {$push:
     {'documents': newDocument
     } })
     console.log("update vesdsefef", updateVessel)
    if(updateVessel)
    return res.status(200).json({
      success: true,
      msg: 'Documents added successfully'
    });
  }
  catch (error) {
    winston.error(error);
  }
};


//Add Reminder to vessel-------------------------
exports.addReminder = async (req, res) => {
  try {
    console.log("reminder", req.body)
    const { vesselId, title, date, time, message } = req.body;
  
      const newReminder =  Reminder({
        managerId: req.data.id,
        vesselId,
        title,
        date: moment(date, "DD-MM-YYYY"),
        time,
        message
      });
    const save = await newReminder.save();
    console.log("save reminder====", save)
    returnCron(req.data.id, vesselId, save.reminderId, moment(date, "DD-MM-YYYY"), time)
      await Vessel.updateOne({_id: vesselId},
      {$push: {reminders: {title, date, time, message}}})
   
    return res.status(200).json({
      success: true,
      data: { newReminder },
    });
  } catch (error) {
    winston.error(error);
  }
};

exports.updateReminder = async (req, res) => {
  try {
    console.log("reminder", req.body)
    const { reminderId, vesselId, title, date, time, message } = req.body;

    const vessel = await Vessel.findOne({_id: vesselId, 'reminders._id': reminderId});
    console.log("vessel====", vessel)
    if(!vessel) return res.status(404).json({error: 'Vessel not found'});
    const image = req.files && req.files.image && keys.apiURL + req.files.image[0].filename;
    const document = req.files && req.files.document && keys.apiURL + req.files.document[0].filename;

    const updateVessel = await Vessel.updateOne(
      {_id: vesselId, 'reminders._id': reminderId},
      {$set:
      { reminders: {title, date, time, message }} })
    returnCron(req.data.id, vesselId, reminderId, moment(date, "DD-MM-YYYY"), time)
     
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    winston.error(error);
  }
};

//Add costs to vessel-----------------------------
exports.addCost = async (req, res) => {
  try {
    const { vesselId, costs } = req.body;
    console.log("add cost  =======>", req.body)
    let image, document;
    const vessel = await Vessel.findById(vesselId);
    if(!vessel) return res.status(404).json({error: 'Vessel not found'});
          let documents = [];
                const docs = JSON.parse(req.body.documents)
                docs && docs.forEach((d, k) => {
                  req.files && req.files.forEach((ele, j) => 
                  {
                    console.log("elel", ele)
                    let indexvalue = ele.originalname.split('-')[0];
                    console.log("indexvalue", indexvalue)
                    console.log("k.tostring()", k.toString())
                  
                  if(k.toString() === indexvalue.substring(0, 1)){
                    console.log("req.files[0].filename", req.files)
                    if(indexvalue.substring(1,2) === 'i'){
                       image =  req.files && keys.apiURL + ele.filename;
                    }
                    else if(indexvalue.substring(1,2) === 'd'){
                       document = req.files && keys.apiURL + ele.filename;
                    }
                    const doesDocumentExpire = d.doesDocumentExpire;
                    const expiryDate = d.expiryDate;
                    const remindMe =d.remindMe ;
                    documents.push({image, document, doesDocumentExpire, expiryDate, remindMe
                    });
                  }
                })
             })
            const title = req.body.costTitle;
            const category = req.body.category;
            const amount = req.body.amount;
            const currency = req.body.currency;
            const date = req.body.date;
            const note = req.body.note;
            const reminder = JSON.parse(req.body.reminder);
            vessel.costs.push({title,amount,category, currency, date , note,reminder, documents });
            const save = await vessel.save();
            const returnData = save.costs;
          return res.status(200).json({
            success: true,
            data: { returnData }
          });
  } catch (error) {
    winston.error(error);
  }
};

//Add inventry to vessel-----------------------------
exports.addInventory = async (req, res) => {
  try {
    const { vesselId, title, category, location, quantity, minQuantity, note, reminder } = req.body;
    const vessel = await Vessel.findById(vesselId);
    if(!vessel) return res.status(404).json({error: 'Vessel not found'});
    const inventoryReminder = JSON.parse(reminder);
    const image = req.files && req.files.image && keys.apiURL + req.files.image[0].filename;
    const document = req.files && req.files.document && keys.apiURL + req.files.document[0].filename;
    const updateVessel = await Vessel.updateOne(
      {_id: vesselId},
      {$push: {'inventory':{ title, category, location, quantity, minQuantity, note, reminder: inventoryReminder, image, document } } })
    if(updateVessel)
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    winston.error(error);
  }
};

//Add Dialy report to vessel-----------------------------
exports.addReport = async (req, res) => {
  try {
    const { vesselId, time, position, speed, estimatedTime, eta, oilLeft, fuelLeft, lubricantOilLeft, anyNeed } = req.body;
    const vessel = await Vessel.findById(vesselId);
    if(!vessel) return res.status(404).json({error: 'Vessel not found'});
    const image = req.files && req.files.image && keys.apiURL + req.files.image[0].filename;
    const document = req.files && req.files.document && keys.apiURL + req.files.document[0].filename;

    const updateVessel = await Vessel.updateOne(
      {_id: vesselId},
      {$push:
      {'report':
      { time, position, speed, estimatedTime, eta, oilLeft, fuelLeft, lubricantOilLeft, anyNeed, image, document } } })
    if(updateVessel)
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    winston.error(error);
  }
};

exports.updateReport = async (req, res) => {
  try {
    console.log("update report calls", req.body)
    const { reportId, vesselId, time, position, speed, estimatedTime, eta, oilLeft, fuelLeft, lubricantOilLeft, anyNeed } = req.body;
    const reportDetail = await Vessel.findOne({_id: vesselId, reports: { $elemMatch: { _id: reportId } }});
    if(!reportDetail) return res.status(404).json({error: 'Report not found'});
    console.log("reportData", reportDetail)
    const reportData = reportDetail && reportDetail[0].report;
    reportData.image = req.files && req.files.image && keys.apiURL + req.files.image[0].filename || reportData.image;
    reportData.document = req.files && req.files.document && keys.apiURL + req.files.document[0].filename || reportData.document;
    
    reportData.time = time || reportData.time;
    reportData.position = position || reportData.position;
    reportData.speed = speed || reportData.speed;
    reportData.estimatedTime = estimatedTime || reportData.estimatedTime;
    reportData.eta = eta || reportData.eta;
    reportData.oilLeft = oilLeft || reportData.oilLeft;
    reportData.fuelLeft = fuelLeft || reportData.fuelLeft;
    reportData.lubricantOilLeft = lubricantOilLeft || reportData.lubricantOilLeft;
    reportData.anyNeed = anyNeed || reportData.anyNeed;
    await reportData.save();
    console.log("after update of report data ==", reportData)
    // const updateVessel = await Vessel.updateOne(
    //   {_id: vesselId, 'reports._id': reportId},
    //   {$set:
    //   {'report':
    //   { time, position, speed, estimatedTime, eta, oilLeft, fuelLeft, lubricantOilLeft, anyNeed, image, document } } })
    // if(updateVessel)
    return res.status(200).json({
      success: true,
      data: {reportData}
    });
  } catch (error) {
    winston.error(error);
  }
};

//Get  -------------------------

exports.getCategories = async (req, res) => {
  try{
    const categories = await Category.find({});

    return res.status(200).json({
      success: true,
      data: { categories }
    })
  }
  catch(error) {
    return res.status(500).json({error : 'Internal server error'});
  }
};

exports.getVesselData = async (req, res) => {
  try {
    console.log("call")
    const page = req.body.page;
    const limit = req.body.limit;
    const date = req.body.date;
    const { type } = req.body;
    let vessel, list;
    let Insurance = [];
    let Licence = [];
    let Certificates = [];
    if(type === 'fixtures'){
     vessel = await Vessel.findOne(
        {_id: req.body.vesselId},
        {fixtures:{$slice:[parseInt(limit) * (page - 1), parseInt(limit)]}}).exec();
        list = vessel.fixtures;
    }
    else if(type === 'documents'){
      console.log("inside documents")
      vessel = await Vessel.findOne(
        {_id: req.body.vesselId}).exec();
  
        documents = vessel.documents;
         Insurance = documents && documents.filter(el => el.category === 'Insurance' )
         Licence = documents && documents.filter(el => el.category === 'Licence' )
         Certificates = documents && documents.filter(el => el.category === 'Certificates' )
    }
    else if(type === 'costs'){
      const filter_costs = [];
      vessel = await Vessel.findOne(
        {_id: req.body.vesselId},
        {costs:{$slice:[parseInt(limit) * (page - 1), parseInt(limit)]}}).exec();
        console.log("vessel", vessel)
        vessel.costs && vessel.costs.forEach((el) => {
          console.log("el of inside coss vess", el)
          console.log("inside costs", new Date(el.date), new Date(date))
         new Date(el.date) >= new Date(date) ? filter_costs.push(el) : null
        })
        console.log("filter_costs", filter_costs)
        list = filter_costs;
    }
    else if(type === 'reminders'){
      vessel = await Vessel.findOne(
        {_id: req.body.vesselId},
        {reminders:{$slice:[parseInt(limit) * (page - 1), parseInt(limit)]}},).exec();
        list = vessel.reminders;
    }
    else if(type === 'report'){
      vessel = await Vessel.findOne(
        {_id: req.body.vesselId},
        {report:{$slice:[parseInt(limit) * (page - 1), parseInt(limit)]}}).exec();
        list = vessel.report;
    }
    else if(type === 'maintenance'){
      vessel = await Vessel.findOne(
        {_id: req.body.vesselId},
        {maintenance:{$slice:[parseInt(limit) * (page - 1), parseInt(limit)]}}).exec();
        list = vessel.maintenance;
    }
    else if(type === 'inventory'){
      vessel = await Vessel.findOne(
        {_id: req.body.vesselId},
        {inventory:{$slice:[parseInt(limit) * (page - 1), parseInt(limit)]}}).exec();
        list = vessel.inventory;
    }  
    if (!vessel) return res.status(404).json({ error: "Not found" });
  
    return res.status(200).json({
      success: true,
      data: { list, Insurance, Certificates, Licence },
    });
    } catch (error) {
    winston.error(error);
  }
};

//Add Dialy report to vessel-----------------------------
exports.addMaintenance = async (req, res) => {
  try {
    const { vesselId, title, date, category, location, description, cost, sparePart } = req.body;
    const vessel = await Vessel.findById(vesselId);
    if(!vessel) return res.status(404).json({error: 'Vessel not found'});
    const image = req.files && req.files.image && keys.apiURL + req.files.image[0].filename || keys.apiURL + "default.png";
    const document = req.files && req.files.document && keys.apiURL + req.files.document[0].filename || keys.apiURL + "default.png";
    const reminder = JSON.parse(req.body.reminder)
    const updateVessel = await Vessel.updateOne(
      {_id: vesselId},
      {$push:
      {'maintenance':
      { title, date, category, location, description, cost, sparePart, reminder, image, document } } })
    if(updateVessel)
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    winston.error(error);
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    console.log("update report calls", req.body)
    let { maintenanceId, vesselId, title, date, category, location, description, cost, sparePart } = req.body;
    const maintenanceDetail = await Vessel.findOne({_id: vesselId, maintenance: { $elemMatch: { _id: maintenanceId } }});
    if(!maintenanceDetail) return res.status(404).json({error: 'Maintenance not found'});
    console.log("reportData", maintenanceDetail)
    const maintenanceData = maintenanceDetail && maintenanceDetail.maintenance[0];
    image = req.files && req.files.image && keys.apiURL + req.files.image[0].filename || maintenanceData.image;
    document = req.files && req.files.document && keys.apiURL + req.files.document[0].filename || maintenanceData.document;
    
    title = title || maintenanceData.title;
    date = date || maintenanceData.date;
    category = category || maintenanceData.category;
    location = location || maintenanceData.location;
    description = description || maintenanceData.description;
    cost = cost || maintenanceData.cost;
    sparePart = sparePart || maintenanceData.sparePart;
     await Vessel.updateOne(
      {_id: vesselId, 'maintenance._id': maintenanceId},
      {$set:
      {'maintenance.$.title': title, 'maintenance.$.date': date, 
       'maintenance.$.category': category, 
       'maintenance.$.location': location,
       'maintenance.$.description': description,
       'maintenance.$.cost': cost,
       'maintenance.$.sparePart': sparePart,
       'maintenance.$.image': image,
       'maintenance.$.document': document  } })
       const updatedMaintenance = await Vessel.findOne({_id: vesselId, maintenance: { $elemMatch: { _id: maintenanceId } }})
       const returnData =  updatedMaintenance.maintenance[0];
       console.log("change of ret,;", returnData)
    // if(updateVessel)
    return res.status(200).json({
      success: true,
      data: { returnData },
    });
  } catch (error) {
    winston.error(error);
  }
};
//Add fixture to vessel-----------------------------
exports.addFixture = async (req, res) => {
  try {
    console.log("req.body===", req.body)
    const { vesselId, loadingPort, dischargingPort, cargo, freight, laycan, commission } = req.body;
    const vessel = await Vessel.findById(vesselId);
    if(!vessel) return res.status(404).json({error: 'Vessel not found'});
    const image = req.files && req.files.image && keys.apiURL + req.files.image[0].filename;
    const document = req.files && req.files.document && keys.apiURL + req.files.document[0].filename;

    const updateVessel = await Vessel.updateOne(
      {_id: vesselId},
      {$push:
      {'fixtures':
      { loadingPort, dischargingPort, cargo, freight, laycan, commission, reminder: JSON.parse(req.body.reminder) , image, document } } })
    if(updateVessel)
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    winston.error(error);
  }
};

//Add fixture to vessel-----------------------------
exports.updateFixture = async (req, res) => {
  try {
    const { vesselId,fixtureId } = req.body;
    const fixtureDetail = await Vessel.findOne({_id: vesselId}, { fixtures: { $elemMatch: { _id: fixtureId } }});
    const fixtureData = fixtureDetail && fixtureDetail.fixtures[0];
    if(!fixtureDetail) return res.status(404).json({error: 'Fixture not found'});
    const image =  req.files && req.files.image && keys.apiURL + req.files.image[0].filename || fixtureData.image;
    const document = req.files && req.files.document && keys.apiURL + req.files.document[0].filename || fixtureData.document;
    const loadingPort = req.body.loadingPort || fixtureData.loadingPort;
    const dischargingPort = req.body.dischargingPort || fixtureData.dischargingPort;
    const cargo = req.body.cargo || fixtureData.cargo;
    const freight = req.body.freight || fixtureData.freight;
    const laycan = req.body.laycan || fixtureData.laycan;
    const commission = req.body.commission || fixtureData.commission;
    const reminder = JSON.parse(req.body.reminder) || fixtureData.reminder;
    //Update Fixture details
    const updateVessel = await Vessel.updateOne(
      {_id: vesselId, 'fixtures._id': fixtureId},
      {$set:
     {fixtures: { loadingPort, dischargingPort, cargo, freight, laycan, commission, reminder, image, document } }})
    if(updateVessel)
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    winston.error(error);
  }
};

//Create Reminder -------------------------

exports.createReminder = async (req, res) => {
  try {
    const { vesselId, title, date, time, message } = req.body;
      const newReminder =  Reminder({
        managerId: req.data.id,
        vesselId,
        title,
        date: moment(date, "DD-MM-YYYY"),
        time,
        message
      });
      const save = await newReminder.save();
      returnCron(req.data.id, vesselId, save.reminderId, moment(date, "DD-MM-YYYY"), time )
   
    return res.status(200).json({
      success: true,
      data: { newReminder },
    });
  } catch (error) {
    winston.error(error);
  }
};


//Get all walkers
exports.getAllOwners = async (req, res) => {
  try {
    console.log("get alml walkers api")
    const pageLimit = parseInt(req.params.pageLimit);
    const page = parseInt(req.params.page);
    let totalOwners = 0;

      totalOwners = await Owner.find({}).countDocuments();

     const owners = await Owner.find({})
        .limit(pageLimit)
        .skip(pageLimit * (page - 1))
        .sort({ created_at: -1 })
        .exec();
   
      return res
      .status(200)
      .json({ success: true, data: { owners, totalOwners } });
    
  }
  catch (error) {
    winston.error(error);
  }
}

exports.getOwnerById = async (req, res) => {
  try {
    const { ownerId } = req.body;
    const user = await Owner.findById({_id: ownerId});
    if(!user) return res.status(404).json({msg: 'Not found'})
    
    let bookings = await Booking.find({ ownerId })
    .populate({ path: "walkerId", select: "basicInfo" })
    .populate({ path: "ownerId", select: "basicInfo" })
    .exec();
    const reviews = await Review.find({ ownerId })
    .populate({ path: "walkerId", select: "basicInfo" })
    .populate({ path: "ownerId", select: "basicInfo" })
    .populate({
      path: "bookingId", 
    })
    .exec();

    return res.status(200).json({
      success: true,
      data: { user, bookings, reviews },
    });
  } catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message });
  }
};

exports.unblockManager = async (req, res) => {
  try {
    const { manager_id } = req.params;

    const manager = await Manager.findById(manager_id);
    if (!manager) return res.status(404).json({ error: "Manager not found" });

    manager.isUserBlocked = !manager.isUserBlocked;
    await manager.save();
    const allManager = await Manager.find({});

    return res.status(200).json({
      success: true,
      data: {managers: allManager},
      msg: "Owner account unblocked",
    });
  } catch (error) {
    winston.error(error);
  }
};

// Purchase subscription
exports.purchaseSubscription = async (req, res) => {
  try {
    const { duration } = await Plan.findOne({_id: req.body.planId})
    const plandate =  new Date();
    var returnDate = plandate.setMonth(plandate.getMonth()+ duration);
    var validTill = new Date(returnDate);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: 100,
    //   currency: 'usd',
    //   payment_method: paymentMethod.id
    // });
    // if(paymentIntent) {
    //   const addPayment = new Payment({
    //     paymentAmount: 100,
    //     managerId,
    //     planId,
    //     paymentStatus: 'Pending',
    //     paymentIntentId: paymentIntent.id
    //   });
    //    await addPayment.save();
    //  }

    const subscription = new Subscription({
      managerId: req.data.id,
      planId,
      datePurchased: new Date(),
      validTill: moment(validTill).format("DD-MM-YYYY"),
      status: "Active",
    });

    await subscription.save();
    return res.status(200).json({
      success: true,
      msg: "You have successfully purchased a subscription",
    });
  } catch (error) {
    console.log(error);
  }
};

exports.searchInventory = async (req, res) => {
  const { query,vesselId } = req.body;
  const { inventory } = await Vessel.findOne({ _id:vesselId})   
  
  let filter_inventories = [];
  if (query) {
    inventory&& inventory.forEach((el) => {
      let query_lowercase = query.toLowerCase();
      if (
        el.title.toLowerCase().includes(query_lowercase)
      ) {
        filter_inventories.push(el);
      }
    });
  } else {
    filter_inventories = [...inventory];
  }
  return res.status(200).json({ success: true, data: { inventory: filter_inventories } });
};

exports.searchInventoryByCategory = async (req, res) => {
  const { query, inventoryId } = req.body;
  const { inventory } = await Vessel.findOne({ _id:vesselId},{inventory: { $elemMatch:{ _id: inventoryId }}});   
  
  let filter_data = [];
  if (query) {
    inventory&& inventory.forEach((el) => {
      let query_lowercase = query.toLowerCase();
      if (
        el.category.toLowerCase().includes(query_lowercase)
      ) {
        filter_data.push(el);
      }
    });
  } else {
    filter_data = [...inventory];
  }
  return res.status(200).json({ success: true, data: { inventory: filter_data } });
};

exports.searchVessel = async (req, res) => {
  const { query, managerId } = req.body;
  const vessel = await Vessel.find({managerId}).exec();
  if (!vessel) return res.status(200).json({ error: "No vessel(s) found" });
  console.log("vessel search", vessel)
  let filter_vessels = [];

  if (query) {
    vessel&& vessel.forEach((f) => {
      let query_lowercase = query.toLowerCase();
      if (
        f.vesselName.toLowerCase().includes(query_lowercase)
      ) {
        filter_vessels.push(f);
      }
    });
  } else {
    filter_vessels = [...vessel];
  }
  return res.status(200).json({ success: true, data: { vessel: filter_vessels } });
};

//Vessel tracking---------------------------
exports.getVesselLocation = async(req, res) => {
  try{
 const { imo } = req.body;
  var config = {
    method: 'get',
    url: `https://api.searoutes.com/vessel/v2/${imo}/eta`,
    headers: { 
      'Content-Type': 'application/json',
      'x-api-key': 'm2EOX5WxDgaXs73KzGWVn1AmfTcs3urX2N0kMuqN'
    }
  };
  axios(config)
  .then(function (response) {
    console.log("vessel api---->", response.data)
    return res.json({data: response.data})
  })
  .catch(function (error) {
    console.log(error);
    return res.json({error: 'No data found'})
  });
  }
  catch(error){
    console.log("eror of vessesl location", error)
    return res.status(500).json({error: 'Internal server error'})
  }
}

exports.bunkerPriceList = async (req, res) => {
  try{
    const response = await axios.get('https://app.bunker-ex.com/api/prices/v1/getAllLivePrices/f7e58d28-a2e1-4881-85e4-bf1448a31e3b')
    console.log('sdsd', response.data)
    const bunkerList = response.data;
    return res.status(200).json({
        success: true,
        data: { bunkerList }
     });
  }
  catch(error) {
    return res.status(500).json({error: 'Internal server error'});
  }
}

exports.currencyExchange = async (req, res) => {
  try{
    const  { baseCurrency, targetCurrency, amount } = req.body;
    var config = {
      method: 'get',
      url: `http://data.fixer.io/api/latest?access_key=${keys.fixerAPI_KEY}`,
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': 'm2EOX5WxDgaXs73KzGWVn1AmfTcs3urX2N0kMuqN'
      }
    };
    axios(config)
    .then(function (response) {
      return res.json({data: response.data})
    })
    .catch(function (error) {
      console.log(error);
    });
  }
  catch (error) {
    return res.status(500).json({error: 'Internal server error'});
  }
}

exports.vesselTracking = async (req, res) => {
  try{
    const { coordinates } = req.body;
    var config = {
      method: 'get',
      url: `https://api.searoutes.com/route/v2/sea/${coordinates}`,
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': 'm2EOX5WxDgaXs73KzGWVn1AmfTcs3urX2N0kMuqN'
      }
    };
    axios(config)
    .then(function (response) {
      return res.json({data: response.data})
    })
    .catch(function (error) {
      console.log("error of catc handle", error)
      return res.json({error: 'No data found'})
    });
  }
  catch(error) {
    console.log("eror of vessesl tracking", error)
    return res.status(500).json({error: 'Internal server error'});
  }
};

exports.getVesselsPosition = async(req, res) => {
try {
 const { imos } = req.body;
  var config = {
    method: 'get',
    url: `https://api.searoutes.com/vessel/v2/${imos}/position`,
    headers: { 
      'Content-Type': 'application/json',
      'x-api-key': 'm2EOX5WxDgaXs73KzGWVn1AmfTcs3urX2N0kMuqN'
    }
  };
  axios(config)
  .then(function (response) {
    console.log("get essels postion--->", response.data)
    return res.json({data: response.data})
  })
  .catch(function (error) {
    console.log("eror handler of vessels position",error);
    return res.json({error: 'No data found'})
  });
  }
  catch(error){
    console.log("error vessels poision", error)
    return res.status(500).json({error: 'Internal server error'})
  }
}

exports.checkPaymentStatus = async (req, res) => {
  try{
    const { paymentIntentId } = req.body;
    const paymentDetails = await Payment.findOne({paymentIntentId});
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if(intent.status === 'succeeded'){
      await Subscription.updateOne({_id: paymentDetails.planId},{ status: 'confirmed', isFeePaid: true, paymentId:paymentDetails._id })
    }
    paymentDetails.paymentStatus = intent.status;
    const paymentUpdated = await paymentDetails.save(); 
    console.log("paymentUpdated", paymentUpdated)
    return res.status(200).json(
      {
        success: true,
        data: { payment: paymentUpdated }})
      }
  catch(error){
    console.log("error log", error)
    return res.status(500)
    .json({ 
      success: false,
      error: 'Something went wrong'
    } )
  }
}

exports.checkPaymentStatus = async (req, res) => {
  try{
    const { paymentIntentId } = req.body;
    const paymentDetails = await Payment.findOne({paymentIntentId});
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if(intent.status === 'succeeded'){
      await Subscription.updateOne({_id: paymentDetails.planId},{ status: 'confirmed', isFeePaid: true, paymentId:paymentDetails._id })
    }
    paymentDetails.paymentStatus = intent.status;
    const paymentUpdated = await paymentDetails.save(); 
    return res.status(200).json(
      {
        success: true,
        data: { payment: paymentUpdated }})
      }
    catch(error){
      console.log("error log", error)
      return res.status(500)
      .json({ 
        success: false,
        error: 'Something went wrong'
      })
    }
}

exports.deleteDocument = async (req, res) => {
  try {
    const updateDocument = await Vessel.updateOne(
        { _id: req.body.vesselId, managerId: req.data.id },
        { $pull: { documents: { _id: req.body.documentId } } },
        { safe: true, multi: true },
      );
      if(!updateDocument) return res.status(500).json({msg: 'something went wrong'})
    return res.status(200).json({
      success: true,
      msg: 'Document deleted successfully'
    });
  }
  catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message});
  }
}

exports.deleteCost = async (req, res) => {
  try {
    const updateCosts = await Vessel.updateOne(
        { _id: req.body.vesselId, managerId: req.data.id },
        { $pull: { costs: { _id: req.body.costId } } },
        { safe: true, multi: true },);

      if(!updateCosts) return res.status(500).json({msg: 'something went wrong'})

    return res.status(200).json({
      success: true,
      msg: 'Cost deleted successfully'
    });
  }
  catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message});
  }
}

exports.deleteInventory = async (req, res) => {
  try {
    const deleteInventory = await Vessel.updateOne(
        { _id: req.body.vesselId, managerId: req.data.id },
        { $pull: { inventory: { _id: req.body.inventoryId } } },
        { safe: true, multi: true },);

    if(!deleteInventory) return res.status(500).json({msg: 'something went wrong'});

    return res.status(200).json({
      success: true,
      msg: 'Inventory deleted successfully'
    });
  }
  catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message});
  }
}

exports.deleteReport = async (req, res) => {
  try {
    const deleteReport = await Vessel.updateOne(
        { _id: req.body.vesselId, managerId: req.data.id },
        { $pull: { report: { _id: req.body.reportId } } },
        { safe: true, multi: true },);

      if(!deleteReport) return res.status(500).json({msg: 'something went wrong'});

    return res.status(200).json({
      success: true,
      msg: 'Report deleted successfully'
    });
  }
  catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message});
  }
}