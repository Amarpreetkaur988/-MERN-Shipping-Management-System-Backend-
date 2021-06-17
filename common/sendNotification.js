require("dotenv").config();
const serverKey =  require ("../ship-manager-9875e-firebase-adminsdk-ukcbk-82687e029f.json")
const FCM = require("fcm-node");
const fcm = new FCM(serverKey);
const Notification = require("../model/notification");
const staff = require("../model/staff");
const Manager = require("../model/manager");

const sendNotification = async (data) => {

  if (data.notificationSendTo == "manager") {
    var user = await Manager.findOne({ _id: data.receiverId }).exec();
  } else if(data.notificationSendTo == "staff") {
    var user = await Staff.findOne({ _id: data.receiverId }).exec();
  }
console.log("user", user)
  // var notification = new Notification({
  //   receiverId: data.receiverId,
  //   notificationSendTo: data.notificationSendTo,
  //   notificationSendAt: moment().format("YYYY-MM-DD hh:mm:ss"),
  //   notificationTitle: data.title,
  //   notificationBody: data.body,
  // });

  // await notification.save();
console.log("after saving notification")
  if (user.devices) {
    let deviceToken = "123";
    if (user.devices.token) deviceToken = user.devices.token;
console.log("user.device.token", user.devices.token)
    var message = {
      to: deviceToken,
      notification: {
        title: data.title,
        body: data.body,
        icon: "ic_launcher",
        sound: "default",
        image: data.doc || "",
      },
    };

    fcm.send(message, async (err, response) => {
      if (err) {
        console.log(err);
      } else {
        console.log(response);
        return response;
       
      }
    });
  }
};

module.exports = sendNotification;
