const express = require("express");
const router = express.Router();
const managerController = require("../controller/managerController");
const middlewares = require("../middleware/fun");
const upload = require("../middleware/multer");

/* -------------------------------------------------------------------------------- */

// Auth
router.post("/signup", managerController.signup);
router.post("/login", managerController.login);
router.post("/otp/verification", managerController.otpVerification);
router.post("/resend/otp", managerController.resendOTP);

router.post(
"/get/profile",
 middlewares.authenticateToken,
 managerController.getProfile
 );
router.put(
"/edit/profile",
  middlewares.authenticateToken,
  upload.fields([
    {name: 'image', maxCount:1},
   ]),
  managerController.editProfile
  );

router.post(
"/add/staff",
upload.fields([
  {name: 'image', maxCount:1},
 ]),
middlewares.authenticateToken,
managerController.addStaff
);

router.post(
  "/update/staff",
  upload.fields([
      {name: 'image', maxCount:1},
     ]),
   middlewares.authenticateToken,
  managerController.updateStaff
  );

router.get(
"/get/staffs",
middlewares.authenticateToken,
managerController.getStaffs
);

router.get(
"/get/staff/:staffId",
middlewares.authenticateToken,
managerController.getStaffDetail
);

// router.put(
// "/update/staff/:staffId",
// upload.single('image'),
// managerController.update
// );

router.post(
"/delete/staff",
middlewares.authenticateToken,
managerController.deleteStaff,
);

router.post(
"/add/vessel",
upload.fields([
    {name: 'image', maxCount:1},
    {name: 'document', maxCount:1},
   ]),
middlewares.authenticateToken,
managerController.addVessel
);

router.get(
"/get/vessels",
middlewares.authenticateToken,
managerController.getVessels
);

router.get(
"/get/vessel/:vesselId",
middlewares.authenticateToken,
managerController.getVesselDetail
);

router.put(
"/update/vessel/:vesselId",
upload.fields([
    {name: 'image', maxCount:1},
    {name: 'document', maxCount:1},
   ]),
 middlewares.authenticateToken,
managerController.updateVessel
);

router.post(
"/delete/vessel",
middlewares.authenticateToken,
managerController.deleteVessel,
);

router.get(
  "/get/all/manager/:pageLimit/:pageNumber",
  managerController.getAllManager
  );
router.post(
  "/create/reminder",
  middlewares.authenticateToken,
  managerController.createReminder
);  
router.get(
  "/unblock/:manager_id",
  // middlewares.authenticateToken,
  managerController.unblockManager
);

router.post(
  "/add/cost",
  upload.array('images', 12), 
  middlewares.authenticateToken,
  managerController.addCost
); 

router.post(
  "/add/inventory",
  upload.fields([
    {name: 'image', maxCount:1},
    {name: 'document', maxCount:12},
   ]),
  middlewares.authenticateToken,
  managerController.addInventory
); 

router.post(
  "/add/maintenance",
  upload.fields([
    {name: 'image', maxCount:1},
    {name: 'document', maxCount:12},
   ]),
  middlewares.authenticateToken,
  managerController.addMaintenance
);
router.post(
  "/update/maintenance",
  upload.fields([
    {name: 'image', maxCount: 1},
    {name: 'document', maxCount:12},
  ]),
  middlewares.authenticateToken,
  managerController.updateMaintenance
)

router.post(
  "/add/fixture",
  upload.fields([
    {name: 'image', maxCount:1},
    {name: 'document', maxCount:12},
   ]),
  middlewares.authenticateToken,
  managerController.addFixture
);

router.post(
  "/add/report",
  upload.fields([
    {name: 'image', maxCount:1},
    {name: 'document', maxCount:12},
   ]),
  middlewares.authenticateToken,
  managerController.addReport
);

router.post(
  "/add/manager/reminder",
  middlewares.authenticateToken,
  managerController.addReminderToManager
)
router.post(
  "/add/reminder",
  middlewares.authenticateToken,
  managerController.addReminder
);
router.post(
  "/get/vessel/data",
 // middlewares.authenticateToken,
  managerController.getVesselData
);
router.post(
  "/update/fixture",
  upload.fields([
    {name: 'image', maxCount:1},
    {name: 'document', maxCount:12},
   ]),
 // middlewares.authenticateToken,
  managerController.updateFixture
);
router.put(
  "/update/reminder",
  
  middlewares.authenticateToken,
  managerController.updateReminder
);
router.post(
  "/update/report",
  upload.fields([
    {name: 'image', maxCount:12},
    {name: 'document', maxCount:12},
   ]),
  middlewares.authenticateToken,
  managerController.updateReport
)

router.post(
  "/vessel/search",
  middlewares.authenticateToken,
  managerController.searchVessel
);
router.post(
  "/inventory/search",
  middlewares.authenticateToken,
  managerController.searchInventory
);

router.post(
  "/inventory/category/search",
  middlewares.authenticateToken,
  managerController.searchInventoryByCategory
);
router.post(
  "/purchase/subscription",
  // middlewares.authenticateToken,
  managerController.purchaseSubscription
);

router.post(
  "/get/vessel/location",
  //middlewares.authenticateToken,
  managerController.getVesselLocation
);

router.get(
  "/get/bunker/list",
  managerController.bunkerPriceList
);

router.post(
  "/get/currency",
  managerController.currencyExchange
);

router.post(
  "/check/payment/status",
  managerController.checkPaymentStatus
);

router.post(
  "/vessel/tracking",
  managerController.vesselTracking
);

router.get(
  "/get/categories",
  managerController.getCategories
)

router.post(
  "/get/vessels/position",
  managerController.getVesselsPosition
);

router.post(
  "/add/document",
  middlewares.authenticateToken,
  upload.fields([
    {name: 'image', maxCount:12},
    {name: 'document', maxCount:12},
   ]),
  managerController.addDocument);

  router.post(
    "/test/document",
    middlewares.authenticateToken,
    managerController.testDocument);

router.post(
  "/delete/document",
  middlewares.authenticateToken,
  managerController.deleteDocument,
);

router.post(
  "/delete/cost", 
  middlewares.authenticateToken,
  managerController.deleteCost
);

router.post(
  "/delete/inventory",
  middlewares.authenticateToken,
  managerController.deleteInventory
);

router.post(
  "/delete/report",
  middlewares.authenticateToken,
  managerController.deleteReport
);

router.post(
  "/add/category",
  //middlewares.authenticateToken,
  managerController.addCategory
);

router.post(
  "/get/category",
  //middlewares.authenticateToken,
  managerController.getCategories
);


module.exports = router;