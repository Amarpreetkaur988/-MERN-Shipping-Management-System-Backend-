const { CronJob } = require ("cron");
const Reminder = require("../model/reminder");
const sendNotification = require("../common/sendNotification");
// import { GetDiffrenceInMinutes } from "../functions";
// import { StartCheckAnNotifyMembers } from "../functions/tournament";

const returnCron = async(managerId, vesselId, reminderId, date, time) => {
    // @hourly
    const reminderDate = new Date(date);
    const getMonth =  reminderDate.getMonth();
    const getDayOfMonth = reminderDate.getDate();
    const getMinutes = time.split(":")[1];
    // const getSeconds = periodEnd.time.split(':')[1];
    const getHours = time.split(":")[0];
    const reminder = await Reminder.findOne({_id: reminderId});

    console.log("getMonth, getDayOfMonth, getMinutes, getHours ", getMonth, getDayOfMonth, getMinutes, getHours )
    const job = new CronJob(`1 ${getMinutes} ${getHours} ${getDayOfMonth} ${getMonth} *`, async () => {
        try {
            let data = {
                senderId: '',
                receiverId: managerId,
                notificationSendTo: "manager",
                title: reminder.title,
                body: reminder.message,
              };
          
             await sendNotification(data);
        } catch (error) {
            return error;
        }
    });
    // Here we start this cron job
    job.start();

    
};
module.exports = { returnCron } 