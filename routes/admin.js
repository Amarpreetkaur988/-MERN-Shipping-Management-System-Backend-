const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const middlewares = require("../middleware/fun");
const upload = require("../middleware/multer");

// const facebookAuth = passport.authenticate("facebook");

/* -------------------------------------------------------------------------------- */

// Auth

router.post("/signup", adminController.signup);

// router.post("/socialSignup", userController.socialSignup);

// router.post("/addSocialAccount", userController.socialAccounts);

// router.get("/login/facebook", facebookAuth, userController.facebook);

// router.get("/email/verify/:id/:token", userController.verifyEmail);

router.post("/login", adminController.login);
// router.post("/verify", adminController.verify);

 router.post("/logout",  middlewares.authenticateToken, adminController.logout );
/* -------------------------------------------------------------------------------- */

// Static Content
router.post(
    "/faq/post",
    // middlewares.authenticateToken,
    adminController.postFAQ
  );
  
  router.put(
    "/faq/update",
    // middlewares.authenticateToken,
    adminController.updateFAQ
  );
  
  router.get(
    "/faq/all/:page/:limit",
    // middlewares.authenticateToken,
    adminController.allFAQ
  );
  
  router.get(
    "/faq/get/:id",
    // middlewares.authenticateToken,
    adminController.getFAQ
  );
  
  router.post(
    "/faq/delete",
    // middlewares.authenticateToken,
    adminController.deleteFAQ
  );    
  
  router.get(
    "/faq/search",
//    middlewares.authenticateToken,
    adminController.searchFAQ
  );

  //Subscription plan----------------------------------------------------
  router.post(
    "/subscription/add",
    middlewares.authenticateToken,
    adminController.addSubscription
  );
  
  router.get(
    "/subscription/all/:pageLimit/:page",
    //middlewares.authenticateToken,
    adminController.allSubscriptions
  );
  
  router.get(
    "/subscription/get/:id",
    middlewares.authenticateToken,
    adminController.getSubscription
  );
  
  router.post(
    "/subscription/update",
    middlewares.authenticateToken,
    adminController.updateSubscription
  );
  
  router.get(
    "/subscription/search",
    middlewares.authenticateToken,
    adminController.searchSubscription
  );
  
  router.post(
    "/subscription/delete",
    middlewares.authenticateToken,
    adminController.deleteSubscription                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
  );
  
//   router.post(
//     "/about/post",
//   //  middlewares.authenticateToken,
//     adminController.postAbout
//   );
  
//   router.get(
//     "/about/get",
//  //   middlewares.authenticateToken,
//     adminController.getAbout
//   );
  
//   router.post(
//     "/help/post",
//     // middlewares.authenticateToken,
//     adminController.postHelp
//   );
  
//   router.get("/help/get",
// //    middlewares.authenticateToken,
//     adminController.getHelp);
  
//   router.post(
//     "/term/conditions/post",
//     // middlewares.authenticateToken,
//     adminController.postTerm
//   );
  
//   router.get(
//     "/term/conditions/get",
//     // middlewares.authenticateToken,
//     adminController.getTerm
//   );

//   router.post(
//     "/term/conditions/get",
//     // middlewares.authenticateToken,
//     upload.fields('image' ),
//     adminController.getTerm
//   );
//   router.post(
//     "/category/add",
//     upload.fields([{name: "image"}]),
//     adminController.addDogCategory
//   );

//   router.get(
//     "/get/categories",
//     adminController.getCategories,
//   );

//   router.get(
//     "/profile/:id",
//     middlewares.authenticateToken,
//     adminController.getProfile,
//   );

   // CMS
   router.get("/cms/get",
   // middlewares.authenticateToken,
     adminController.getCMS);
 
   router.post(
     "/cms/about/update",
   //  middlewares.authenticateToken,
     adminController.updateAbout
   );
   
   router.post(
     "/cms/policy/update",
  //   middlewares.authenticateToken,
     adminController.updatePolicy
   );
   router.post(
    "/cms/terms/update",
 //   middlewares.authenticateToken,
    adminController.updateTerms
  );

  router.get(
    "/profile/:id",
    middlewares.authenticateToken,
    adminController.getProfile,
  );

  router.post(
    "/profile",
    middlewares.authenticateToken,
    upload.single("image"),
    adminController.submitProfile
  );
   
   router.post(
     "/cms/terms/update",
  //   middlewares.authenticateToken,
     adminController.updateTerms
   ); 
 router.post(
   "/change/password",
   middlewares.authenticateToken,
   adminController.changePassword
 );

 router.post(
  "/manager/add",
  middlewares.authenticateToken,
  adminController.addManager
);

// router.post(
//   "/manager/update",
//   upload.fields([
//     {name: 'image', maxCount:1},
//    ]),
//   //middlewares.authenticateToken,
//   adminController.updateManager
// );


 router.post(
  "/manager/delete",
  middlewares.authenticateToken,
  adminController.deleteManager
);

router.post(
  "/staff/delete",
  middlewares.authenticateToken,
  adminController.deleteStaff
);

router.get(
  "/get/staffs/:pageLimit/:pageNumber",
  adminController.getAllStaff,
);
module.exports = router;

//Blog------------------------------------------------------
router.post(
  "/blog/post",
  upload.fields([
        {name: 'image', maxCount:1},
       ]),
  // middlewares.authenticateToken,
  adminController.postBlog
);

router.put(
  "/blog/update",
  upload.fields([
    {name: 'image', maxCount:1},
   ]),
  // middlewares.authenticateToken,
  adminController.updateBlog
);

router.get(
  "/blog/all/:page/:limit",
  // middlewares.authenticateToken,
  adminController.allBlog
);

router.get(
  "/blog/get/:id",
  // middlewares.authenticateToken,
  adminController.getBlog
);

router.post(
  "/blog/delete",
  // middlewares.authenticateToken,
  adminController.deleteBlog
);

router.get(
  "/blog/search",
//    middlewares.authenticateToken,
  adminController.searchBlog
);

router.get(
  "/manager/search",
//middlewares.authenticateToken,
  adminController.searchManager
);

router.get(
  "/captain/search",
//middlewares.authenticateToken,
  adminController.searchCaptain
);

router.post(
  "/captain/add",
  middlewares.authenticateToken,
  adminController.addCaptain
);

router.post(
  "/captain/delete",
  middlewares.authenticateToken,
  adminController.deleteCaptain
);

router.get(
  "/get/all/manager",
  adminController.getManagerList
  );
