const passwordHash = require("password-hash");
const jwt = require("jsonwebtoken");
const winston = require("winston");
const moment = require("moment");
const keys = require("../config/keys");
const generateOTP = require("../common/generateOTP");
const notificationTypes = require("../common/notificationTypes");
const Staff = require("../model/staff");
const Vessel = require("../model/vessel");
const Admin = require("../model/admin");
const Stripe = require('stripe');
const Payment = require("../model/payment");
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
     console.log("logib", req.body)
    if (!email) {
      return res
        .status(404)
        .json({ error: "Email or Phone Number is required" });
    }
    let user;
    if (email) {
       user = await Owner.findOne({
       'basicInfo.email':email
      });
     
    if (!user) return res.status(404).json({ error: "Email not found" });

      if (user.basicInfo.isUserBlocked) {
        return res
          .status(400)
          .json({ error: "Sorry, Your account is suspended." });
      }
    }

    const verifyPassword = passwordHash.verify(
      password,
      user.basicInfo.password
    );
    console.log("verifyPassword", verifyPassword)
    if (!verifyPassword)
      return res.status(403).json({ error: "Invalid Password" });

    const payload = {
      id: user._id,
      name: `${user.basicInfo.fullName}`,
      // image: patient.basicInfo.image ? patient.basicInfo.image : "",
      email: user.basicInfo.email ? user.basicInfo.email : "",
      // phoneNumber: patient.basicInfo.phoneNumber
      //   ? patient.basicInfo.phoneNumber
      //   : "",
    };

    let jwtoken = jwt.sign(payload, keys.secretOrKey, { expiresIn: 31556926 });

    user.basicInfo.coordinates = {
      lat,
      lng,
    };

    user.basicInfo.devices = {
      deviceId,
      deviceType,
      token: deviceToken,
    };
    console.log("user final", user)
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
    const { email, fullName, country, password } = req.body;
    console.log("req.body==", req.body)
    let check_email = await Owner.findOne({'basicInfo.email': email});
    console.log("check_email", check_email)
    if (check_email)
      return res.status(400).json({ error: "Email is already registered" });
 
      const hashedPassword = passwordHash.generate(password);
      console.log("req.files.image[0]", req.files.image)
      const image1 =  req.files.image && req.files.image[0].path;
      console.log("image1", image1)
     let new_user = new Owner({
       // image: req.body.image,
       basicInfo: {
        fullName: fullName,
        email: email.toLowerCase(),
        country: country,
        password: hashedPassword,
        accountType: "owner",
        image: req.files && req.files.image && req.files.image[0].path || keys.apiURL + "default.png",
       },
     });

    const payload = {
      id: new_user._id,
      name: `${new_user.basicInfo.fullName}`,
    };

    let token = jwt.sign(payload, keys.secretOrKey, { expiresIn: 31556926 });

    const save = await new_user.save();
    console.log("save", save)
    // const owner = new Owner( {ownerId: save._id })
    // await owner.save();

    return res.status(200).json({
      success: true,
      msg: "Details saved",
      data: { user: save, token },
    });
  } catch (error) {
    winston.error(error);
  }
};

//owner Profile -------------------------
exports.getOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.data.id);
    if (!owner) return res.status(404).json({ error: "Owner not found" });

    // patient.basicInfo.coordinates = {
    //   lat: req.query.lat,
    //   lng: req.query.lng,
    // };

    // owner.devices = {
    //   deviceId: req.query.deviceId,
    //   deviceType: req.query.deviceType,
    //   token: req.query.token,
    // };

    // await owner.save();
    const bookings = await Booking.find({ ownerId: req.data.id })
      .populate({ path: "ownerId", select: "basicInfo" })
      .populate({ path: "walkerInfo", select: "basicInfo" });

    const reviews = await Review.find({ ownerId: req.data.id })
      .populate({ path: "ownerId", select: "basicInfo" })
      .populate({ path: "walkerInfo", select: "basicInfo" })
      .populate({
        path: "bookingId",
      })
      .exec();

    return res.status(200).json({
      success: true,
      data: {
        owner,
        bookings: bookings.length > 0 ? bookings : [],
        reviews: reviews.length > 0 ? reviews : [],
      },
    });
  } catch (error) {
    winston.error(error);
  }
};

exports.addDog = async (req, res) => {
  try {
   const { dogs_array } = req.body;
   console.log("dogs_array", req.body)
   const data = JSON.parse(dogs_array);
   console.log(data)
   console.log("req.files====>", req.files)
    let check_owner = await Owner.findOne({_id: req.data.id});
    if (!check_owner)
     return res
        .status(404)
        .json({ error: "Owner not found" });
      
        data && data.forEach((el, i) => {
          let images = [];
          //  images.push(req.files && req.files.images && req.files.images[0].path);
          console.log("req.files inside loop ", req.files)
          images.push(el.images && req.files.images[0].name);
          // images.push(req.files && req.files.image2 && req.files.image2[0].path);
          // images.push(req.files && req.files.image3 && req.files.image3[0].path);
          // images.push(req.files && req.files.image4 && req.files.image4[0].path);
          // images.push(req.files && req.files.image5 && req.files.image5[0].path);
          const dogName = el.dogName;
          const gender = el.gender;
          const dogSize = el.dogSize;
          const breed = el.breed;
          check_owner.dogs.push({dogName, gender, dogSize, breed , images });
        })
        const save = await check_owner.save();

    return res.status(200).json({
      success: true,
      msg: "Details saved",
      data: { user: save },
    });
  } catch (error) {
    winston.error(error);
  }
};

exports.getAllOwner = async (req, res) => {
  try {
    const all_owner = await Owner.find({'basicInfo.accountType': 'owner'});
    if(!all_owner) return res.status(404).json({msg: 'No owner found'})

    return res.status(200).json({
      success: true,
      data: { all_owner },
    });
  } catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message });
  }
};

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
 }
catch (error) {
  winston.error(error);
}
};

exports.getPayments = async (req, res) => {
try{
 const paymentDetails = await Payment.find({});
 console.log("paymentdetails", paymentDetails)
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

exports.addReview = async (req, res) => {
  try {
    const owner = await Owner.findOne({_id: req.data.id});
    if (!owner) return res.status(404).json({ error: "User not found" });

    const booking = await Booking.findOne({
      bookingId: req.body.bookingId,
    });

    if (!booking)
      return res.status(404).json({ error: "Booking not found" });

    let get_review = await Review.findOne({
      ownerId: req.data.id,
      walkerId: req.body.walkerId,
      bookingId: req.body.bookingId,
      reviewBy: 'owner',
    });

    if (get_review)
      return res.status(400).json({ error: "Review already submitted." });

    if (booking.status !== "completed") {
      return res.status(400).json({
        error:
          "Sorry, You are not allowed to submit review for this booking.",
      });
    }

    const review = await new Review({
      ownerId: req.data.id,
      walkerId: req.body.walkerId,
      bookingId: req.body.bookingId,
      rating: req.body.rating,
      review: req.body.review,
      reviewBy: 'owner',
      isRecommended: req.body.isRecommended,
    });

    const save = await review.save();
    return res
      .status(200)
      .json({ success: true, msg: "Review saved", data: { review: save } });
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
    console.log("transfer ==>", transfer)
  }
  catch (error) {
    winston.error(error);
  }
}


exports.getCaptainById = async (req, res) => {
  try {
    const { captainId } = req.body;
    const user = await Staff.findById({_id: captainId}).populate({path: 'vessels.vesselId', });
    if(!user) return res.status(404).json({msg: 'Not found'})

    console.log("user", user)
    // const vessels = await Vessel.find({
    //   'captainId': { $in: [ captainId ]}}).populate({path: 'captainId'});
    //  console.log("vessels", vessels)

    return res.status(200).json({
      success: true,
      data: { user},
    });
  } catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message });
  }
};