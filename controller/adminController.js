const passwordHash = require("password-hash");
const jwt = require("jsonwebtoken");
const winston = require("winston");
const fs = require("fs");
const sendMail = require("../common/sendMail");
const Manager = require("../model/manager");
const Vessel = require("../model/vessel");
const Staff = require("../model/staff");
const FAQ = require("../model/faq");
const Plan = require("../model/plans");
const keys = require("../config/keys");
const Admin = require("../model/admin");
const CMS = require("../model/cms");
const Blog = require("../model/blog");

exports.login = async (req, res) => {
  console.log("login")
  const { id, password, role } = req.body;
  console.log("login api", id, password, role);
  let token = "";

  var admin = await Admin.findOne({
    $or: [{ email: id.toLowerCase() }, { phoneNumber: id.toLowerCase() }],
  });
  if (!admin) return res.status(200).json({ error: "Admin not found" });

  const verifyPassword = passwordHash.verify(password, admin.password);
  if (!verifyPassword)
    return res.status(200).json({ error: "Incorrect Password" });

  admin.accessApiDocs = true;
  await admin.save();

  const payload = {
    id: admin._id,
    name: `${admin.firstName} ${admin.lastName}`,
    image: admin.image,
    email: admin.email,
    phoneNumber: admin.phoneNumber,
  };
  token = jwt.sign(payload, keys.secretOrKey, { expiresIn: 31556926 });

  return res
    .status(200)
    .json({ success: true, msg: "Logged in", data: { token } });
};

exports.logout = async (req, res) => {
  try {
    var admin = await Admin.findById(req.data.id);
    if (!admin) return res.status(200).json({ error: "Admin not found" });

    admin.accessApiDocs = false;
    await admin.save();

    return res
      .status(200)
      .json({ success: true, msg: "Logged out successfully" });
  } catch (error) {
    winston.error(error);
  }
};

/* -------------------------------------------------------------------------------- */

//  Subscription Plans

exports.addSubscription = async (req, res) => {
  const plan = new Plan({
    planName: req.body.planName,
    amount: req.body.planAmount,
    duration: req.body.duration,
    planFor: req.body.planFor,
    text: req.body.text,
    status: req.body.status,
  });

  await plan.save();
  return res
    .status(200)
    .json({ success: true, msg: "Subscription Plan Added" });
};

exports.allSubscriptions = async (req, res) => {
  const pageLimit = req.params.pageLimit;
  const page = req.params.page;

  const all_plans = await Plan.find({}).countDocuments();

  const plans = await Plan.find({})
    .limit(parseInt(pageLimit))
    .skip(parseInt(pageLimit) * (page - 1))
    .exec();

  if (!plans)
    return res.status(200).json({ error: "No subscription plan(s) found" });

  return res.status(200).json({ success: true, data: { plans, all_plans } });
};

exports.getSubscription = async (req, res) => {
  const plan = await Plan.findById(req.params.id).exec();
  if (!plan)
    return res.status(200).json({ error: "No subscription plan found" });

  return res.status(200).json({ success: true, data: { plan } });
};

exports.updateSubscription = async (req, res) => {
  const plan = await Plan.findById(req.body.id).exec();
  if (!plan)
    return res.status(200).json({ error: "No subscription plan found" });
  plan.planName = req.body.planName;
  plan.amount = req.body.planAmount;
  plan.duration = req.body.duration;
  plan.planFor = req.body.planFor;
  plan.status = req.body.status;
  plan.text = req.body.text;

  await plan.save();
  return res
    .status(200)
    .json({ success: true, msg: "Subscription Plan Updated" });
};

exports.searchSubscription = async (req, res) => {
  const query = req.query.query;
  let filter_subscriptions = [];

  const plans = await Plan.find({}).exec();
  if (!plans)
    return res.status(200).json({ error: "No subscription plan found" });

  if (query !== "" && query != undefined) {
    plans.forEach((p) => {
      let query_lowercase = query.toLowerCase();
      if (
        p.planName.toLowerCase().includes(query_lowercase)  ||
        p.status.toLowerCase().includes(query_lowercase)
      ) {
        filter_subscriptions.push(p);
      }
    });
  } else {
    filter_subscriptions = [...plans];
  }

  return res
    .status(200)
    .json({ success: true, data: { plans: filter_subscriptions } });
};

exports.deleteSubscription = async (req, res) => {
  const { id } = req.body;
  const plans = await Plan.findByIdAndRemove(id).exec();
  if (!plans)
  return res.status(200).json({ error: "No subscription plan found" });
  
  return res
    .status(200)
    .json({ success: true, msg: "Subscription Plan deleted" });
};

exports.signup = async (req, res) => {
  try {
    // check existing email
    const { email, fullName, password } = req.body;
    let check_email = await Admin.findOne({email});
 
    if (check_email)
      return res.status(400).json({ error: "Email is already registered" });

      const hashedPassword = passwordHash.generate(password);
      // const image1 =  req.files.image && req.files.image[0].path;
      // console.log("image1", image1)
     let new_user = new Admin({
       // image: req.body.image,
     
        fullName: fullName,
        email: email.toLowerCase(),
        // country: country,
        password: hashedPassword,
        role: "admin",
      
     });

    const payload = {
      id: new_user._id,
      name: `${new_user.fullName}`,
    };

    let token = jwt.sign(payload, keys.secretOrKey, { expiresIn: 31556926 });

    const save = await new_user.save();
   console.log("save", save)

    return res.status(200).json({
      success: true,
      msg: "Details saved",
      data: { user: save, token },
    });
  } catch (error) {
    winston.error(error);
  }
};

/* -------------------------------------------------------------------------------- */

// Static Content

exports.postFAQ = async (req, res) => {
   console.log("req.body ===", req.body)
   const faq = new FAQ({
     question: req.body.question,
     answer: req.body.answer,
     status: req.body.status,
   });
 
 
   await faq.save();
   return res.status(200).json({ success: true, msg: "FAQ Created" });
 };
 exports.updateFAQ = async (req, res) => {
   try{
     let { id, question, answer, status } = req.body;
 
     let faq = await FAQ.findOne({_id: id}).exec();
     if (!faq) return res.status(200).json({ error: "FAQ not found" });
    
     faq.question = question;
     faq.answer = answer;
     faq.status = status;
 
     await faq.save();
 
     return res.status(200).json({ success: true, msg: "FAQ Updated" });
   } catch (error) {
     console.log(error);
   }
 };
 
 exports.allFAQ = async (req, res) => {
   const page = req.params.page;
   const limit = req.params.limit;
   const all_faq = await FAQ.find({}).countDocuments();
 
   const faq = await FAQ.find({})
     .limit(parseInt(limit))
     .skip(parseInt(limit) * (page - 1))
     .exec();

  
   if (!faq) return res.status(200).json({ error: "No faq(s) found" });
 
   return res.status(200).json({ success: true, data: { faq, all_faq } });
 };
 
 exports.getFAQ = async (req, res) => {
   const { id } = req.params;
 
   const faq = await FAQ.findById(id).exec();
   if (!faq) return res.status(200).json({ error: "No faq(s) found" });
 
   return res.status(200).json({ success: true, data: { faq } });
 };
 
 exports.deleteFAQ = async (req, res) => {
   const { id } = req.body;
 
   const faq = await FAQ.findByIdAndRemove(id).exec();
   if (!faq) return res.status(200).json({ error: "No faq(s) found" });
 
   return res.status(200).json({ success: true, msg: "FAQ deleted" });
 };
 
 exports.searchFAQ = async (req, res) => {
   const { query } = req.query;
 
   const faq = await FAQ.find({}).exec();
   if (!faq) return res.status(200).json({ error: "No faq(s) found" });
 
   let filter_faqs = [];
 
   if (query) {
     faq.forEach((f) => {
       let query_lowercase = query.toLowerCase();
 
       if (
         f.question.toLowerCase().includes(query_lowercase) ||
         f.status.toLowerCase().includes(query_lowercase)
       ) {
         filter_faqs.push(f);
       }
     });
   } else {
     filter_faqs = [...faq];
   }
 
   return res.status(200).json({ success: true, data: { faq: filter_faqs } });
 };
 
 exports.changePassword = async (req, res) => {
  try {
    let { currentPassword, newPassword } = req.body;
  
    const admin = await Admin.findById(req.data.id);
    if (!admin) return res.status(200).json({ error: "Admin not found" });

    let verify_password = passwordHash.verify(currentPassword, admin.password);
    if (!verify_password)
      return res.status(200).json({ error: "Old Password is incorrect" });

      admin.password = passwordHash.generate(newPassword);
      await admin.save();
    return res
      .status(200)
      .json({ success: true, msg: "Password changed successfully" });
  } catch (error) {
    winston.error(error);
  }
};
exports.submitProfile = async (req, res) => {
  try {
    console.log("req bofy of----", req.body)
    const admin = await Admin.findOne({
      _id: req.body.id,
    });
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    admin.firstName = req.body.firstName;
    admin.lastName = req.body.lastName;
    admin.address = req.body.address;
    admin.email = req.body.email;
    admin.phoneNumber = req.body.phoneNumber;
    admin.image = req.file ? keys.apiURL + req.file.filename : admin.image;

    const save = await admin.save();
    return res
      .status(200)
      .json({ success: true, msg: "Profile Updated", data: { profile: save } });
  } catch (error) {
    winston.error(error);
  }
};

exports.getCMS = async (req, res) => {
  try {
    console.log("gett cmds")
    let cms = await CMS.findOne({}).exec();
    console.log("cms", cms)
    if (!cms) return res.status(200).json({ error: "No data found" });

    return res.status(200).json({ success: true, data: { cms } });
  } catch (error) {
    winston.error(error);
  }
};

exports.updateAbout = async (req, res) => {
  try {
    console.log("update about")
    let { about } = req.body;

    let cms = await CMS.findOne({}).exec();
    if (!cms) {
      const new_cms = new CMS({
        about,
      });

      await new_cms.save();
    } else {
      cms.about = about;
      await cms.save();
    }

    return res
      .status(200)
      .json({ success: true, msg: "About content updated" });
  } catch (error) {
    winston.error(error);
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    let { policy } = req.body;

    let cms = await CMS.findOne({}).exec();

    if (!cms) {
      const new_cms = new CMS({
        policy,
      });
      await new_cms.save();
    } else {
      cms.policy = policy;
      await cms.save();
    }
    return res
      .status(200)
      .json({ success: true, msg: "Policy content updated" });
  } catch (error) {
    winston.error(error);
  }
};
exports.updateTerms = async (req, res) => {
  try {
    let { terms } = req.body;

    let cms = await CMS.findOne({}).exec();

    if (!cms) {
      const new_cms = new CMS({
        terms,
      });
      await new_cms.save();
    } else {
      cms.terms = terms;
      await cms.save();
    }

    return res
      .status(200)
      .json({ success: true, msg: "Terms & conditions content updated" });
  } catch (error) {
    winston.error(error);
  }
};

/* -------------------------------------------------------------------------------- */

// Ratings & Reviews

exports.allReviews = async (req, res) => {
  try {
    let { pageLimit, page } = req.params;

    let all_reviews = await Review.find({}).countDocuments();

    let reviews = await Review.find({})
      .populate({ path: "patient_id", select: "basicInfo" })
      .populate({ path: "doctor_id", select: "basicInfo" })
      .populate({
        path: "appointment_id",
        select:
          "category consultation_type reason description duration date consultation_fee time session status",
      })
      .limit(parseInt(pageLimit))
      .skip(parseInt(pageLimit) * (page - 1))
      .exec();

    return res
      .status(200)
      .json({ success: true, data: { reviews, all_reviews } });
  } catch (error) {
    winston.error(error);
  }
};

exports.deleteReview = async (req, res) => {
  try {
    let { id } = req.body;

    let review = await Review.findByIdAndDelete(id);
    if (!review)
      return res.status(200).json({ error: "Failed to delete review" });

    return res.status(200).json({ success: true, msg: "Review deleted" });
  } catch (error) {
    winston.error(error);
  }
};


exports.updateReview = async (req, res) => {
  try {
    let { id, rating, review, isRecommended } = req.body;

    let get_review = await Review.findById(id);
    if (!get_review) return res.status(200).json({ error: "Review not found" });

    get_review.rating = rating;
    get_review.review = review;
    get_review.isRecommended = isRecommended;
    await get_review.save();

    return res.status(200).json({ success: true, msg: "Review updated" });
  } catch (error) {
    winston.error(error);
  }
};

exports.addDogCategory = async (req, res) => {
  try {
    const { title } = req.body;
     const addCategory = new Category({
      title,
     image: req.files ? req.files.image[0].path : "",
     })
   
    const save = await addCategory.save();

    return res.status(200).json({
      success: true,
      msg: "Details saved",
      data: { category: save },
    });
    } catch (error) {
      winston.error(error);
    }
  };

  exports.getCategories = async (req, res) => {
   try {
   
    const categories = await Category.find({});
     console.log("categories ==>", categories)
    return res.status(200).json({
      success: true,
      data: { categories },
    });
    } catch (error) {
      winston.error(error);
    }
  };

  exports.getAllOwners = async (req, res) => {
    try{
      const { pageLimit, page } = req.body;
      const owners = await Owner.find({})
      .limit(parseInt(pageLimit))
      .skip(parseInt(pageLimit) * (page - 1))
      .exec();

      return res.status(200).json({
        success: true,
        data: { owners },
      })
    }
    catch (error) {
    winston.error(error);
    }
  };

  exports.getAllWalkers = async (req, res) => {
    try {
      const { pageLimit, page } = req.body;
      const walkers = await Walker.find({})
      .limit(parseInt(pageLimit))
      .skip(parseInt(pageLimit) * (page - 1))
      .exec();

      return res.status(200).json({
        success: true,
        data: { walkers },
      })
    }
    catch (error) {
    winston.error(error);
    }
  };

exports.getProfile = async (req, res) => {
  try{
    console.log("get profile")
  const admin = await Admin.findOne({_id:req.params.id});
  console.log("admijn", admin)
  if (!admin)
    return res.status(404).json({ error: "Admin account does not exists" });

  return res.status(200).json({ success: true, data: { admin } });
  }
  catch (error) {
    winston.error(error);
  }
};

exports.deleteManager = async (req, res) => {
  try {
    let { id } = req.body;

    const manager = await Manager.findByIdAndRemove(id);
    if (!manager) return res.status(404).json({ error: "Manager not found" });

     await Vessel.deleteMany({managerId: manager._id});
     await Staff.deleteMany({managerId: manager._id});

    return res.status(200).json({ success: true, msg: "Manager deleted" });
  } catch (error) {
    winston.error(error);
  }
};

exports.deleteCaptain = async (req, res) => {
  try {
    let { id } = req.body;
  console.log("req.body", req.body)
    const captain = await Staff.findByIdAndRemove(id);
    if (!captain) return res.status(404).json({ error: "Captain not found" });

    return res.status(200).json({ success: true, msg: "Captain deleted" });
  } catch (error) {
    winston.error(error);
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    let { id } = req.body;

    const staff = await Staff.findByIdAndRemove(id);
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    return res.status(200).json({ success: true, msg: "Staff deleted" });
  } catch (error) {
    winston.error(error);
  }
};

exports.getAllStaff = async (req, res) => {
  try {
    console.log(" get all staff")
    const pageLimit = parseInt(req.params.pageLimit);
    const page = parseInt(req.params.pageNumber);

     const staffs = await Staff.find({staffRole: 'captain'})
     .populate(
       {path:'managerId',
       select: { firstName: 1, lastName: 1}
      }
       )
        .limit(pageLimit)
        .skip(pageLimit * (page - 1))
        .sort({ created_at: -1 })
        .exec();
        const all_staff = await Staff.find({staffRole: 'captain'}).countDocuments();
   
      return res
      .status(200)
      .json({ success: true, data: { staffs, all_staff } });

  } catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message });
  }
}

//Blogs
exports.postBlog = async (req, res) => {
  console.log("req.body ===", req.body)
  const blog = new Blog({
    title: req.body.title,
    body: req.body.body,
    image: req.files && req.files.image && keys.apiURL + req.files.image[0].filename || keys.apiURL + "default.png",
    status: req.body.status,
  });


  await blog.save();
  return res.status(200).json({ success: true, msg: "Blog Created" });
};
// exports.updateBlog = async (req, res) => {
//   try{
//     let { id, title, description, status } = req.body;

//     let blog = await Blog.findOne({_id: id}).exec();
//     if (!blog) return res.status(200).json({ error: "Blog not found" });
   
//     blog.title = title;
//     blog.description = description;
//    // blog.image = req.files && req.files.image && keys.apiURL + req.files.image[0].filename || blog.image,
//     blog.status = status;

//     await blog.save();

//     return res.status(200).json({ success: true, msg: "Blog Updated" });
//   } catch (error) {
//     console.log(error);
//   }
// };

exports.allBlog = async (req, res) => {
  const page = req.params.page;
  const limit = req.params.limit;
  const all_blog = await Blog.find({}).countDocuments();

  const blog = await Blog.find({})
    .limit(parseInt(limit))
    .skip(parseInt(limit) * (page - 1))
    .exec();

  

  if (!blog) return res.status(200).json({ error: "No blog(s) found" });

  return res.status(200).json({ success: true, data: { blog, all_blog } });
};

exports.getBlog = async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id).exec();
  if (!blog) return res.status(200).json({ error: "No blog(s) found" });

  return res.status(200).json({ success: true, data: { blog } });
};

exports.deleteBlog = async (req, res) => {
  const { id } = req.body;

  const blog = await Blog.findByIdAndRemove(id).exec();
  if (!blog) return res.status(200).json({ error: "No blog(s) found" });

  return res.status(200).json({ success: true, msg: "Blog deleted" });
};

exports.searchBlog = async (req, res) => {
  const { query } = req.query;

  const blog = await Blog.find({}).exec();
  if (!blog) return res.status(200).json({ error: "No blog(s) found" });

  let filter_blogs = [];

  if (query) {
    blog.forEach((b) => {
      let query_lowercase = query.toLowerCase();
      if (
        b.title && b.title.toLowerCase().includes(query_lowercase) ||
        b.description && b.description.toLowerCase().includes(query_lowercase)
      ) {
        filter_blogs.push(b);
      }
    });
  } else {
    filter_blogs = [...blog];
  }

  return res.status(200).json({ success: true, data: { blog: filter_blogs } });
};

//BLOG----------------------------------------------------------------------
exports.postBlog = async (req, res) => {
  console.log("req.body ===", req.body)
  const blog = new Blog({
    description: req.body.description,
    title: req.body.title,
    status: req.body.status,
    image:req.files && 
    req.files.image && 
    keys.apiURL + req.files.image[0].filename || keys.apiURL + "blog-default.png"
  });

  await blog.save();
  return res.status(200).json({ success: true, msg: "Blog Created" });
};

exports.updateBlog = async (req, res) => {
  try{ 
    console.log("update blog-", req.body)
    let { id, title, description, status } = req.body;

    let blog = await Blog.findOne({_id: id}).exec();
    if (!blog) return res.status(200).json({ error: "Blog not found" });

    blog.image = req.files && req.files.image && keys.apiURL + req.files.image[0].filename || blog.image;
    blog.title = title;
    blog.description = description;
    blog.status = status;

    await blog.save();

    return res.status(200).json({ success: true, msg: "FAQ Updated" });
  } catch (error) {
    console.log(error);
  }
};

exports.allBlog = async (req, res) => {
  const page = req.params.page;
  const limit = req.params.limit;
  const all_blog = await Blog.find({}).countDocuments();

  const blog = await Blog.find({})
    .limit(parseInt(limit))
    .skip(parseInt(limit) * (page - 1))
    .exec();

  if (!blog) return res.status(200).json({ error: "No blog(s) found" });

  return res.status(200).json({ success: true, data: { blog, all_blog } });
};

exports.getBlog = async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findById(id).exec();
  if (!blog) return res.status(200).json({ error: "No blog(s) found" });

  return res.status(200).json({ success: true, data: { blog } });
};

exports.deleteBlog = async (req, res) => {
  const { id } = req.body;
  const blog = await Blog.findByIdAndRemove(id).exec();
  if (!blog) return res.status(200).json({ error: "No blog(s) found" });

  return res.status(200).json({ success: true, msg: "Blog deleted" });
};


exports.addManager = async (req, res) => {
  try {
    // check existing email
    const { firstName, lastName, email, phoneNumber, pageLimit, page  } = req.body;
    const defaultPassword = firstName.substring(0,3) + Math.floor(100 + Math.random() * 9000);
    let check_email = await Manager.findOne({'email': email});
    if (check_email)
      return res.status(400).json({ error: "Email is already registered" });
  
      const hashedPassword = passwordHash.generate(defaultPassword);
      let new_user = new Manager({
       isVerified: true,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phoneNumber,
        firstName,
        lastName,
    });
      await new_user.save();
      const managers = await Manager.find({})
      .limit(parseInt(pageLimit))
      .skip(parseInt(pageLimit) * (page - 1))
      .exec();
      console.log("managers", managers)
      const subject = "User Password";
      const text =  "Your otp is "+ defaultPassword;
      await sendMail(email, subject, text);
      return res.status(200).json({
      success: true,
      msg: "Details saved",
      data: { managers,  },
    });
  } catch (error) {
    winston.error(error);
  }
};

exports.searchManager = async (req, res) => {
  try{
   const { query } = req.query;
   const managers = await Manager.find({}).exec();
   if (!managers) return res.status(200).json({ error: "No manager(s) found" });
   let filter_managers = [];
 
   if (query) {
    managers.forEach((f) => {
       let query_lowercase = query.toLowerCase();
       if(
        f.firstName && f.firstName.toLowerCase().includes(query_lowercase) ||
        f.email && f.email.toLowerCase().includes(query_lowercase)||
        f.status && f.status.toLowerCase().includes(query_lowercase)
       ) {
        filter_managers.push(f);
       }
     });
   } else {
    filter_managers = [...managers];
   }
   return res.status(200).json({ success: true, data: { managers: filter_managers } });
}
catch (error) {
  return res.status(500).json({error: 'Internal server error'});
}
};

exports.addCaptain = async (req, res) => {
  try {
    // check existing email
    console.log("req.body", req.body)
    const { pageLimit, page } = req.body;
    const { username, email, phoneNumber, managerId } = req.body.captain;
    const defaultPassword = username.substring(0,3) + Math.floor(100 + Math.random() * 9000);
    let check_email = await Staff.findOne({'email': email});
    if (check_email)
      return res.status(400).json({ error: "Email is already registered" });
      const hashedPassword = passwordHash.generate(defaultPassword);
      let new_user = new Staff({
        isVerified: true,
        managerId,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phoneNumber,
        username,
        staffRole: 'captain'
      });
      const saved = await new_user.save();
      const staffs = await Staff.find({staffRole: 'captain'})
      .limit(parseInt(pageLimit))
      .skip(parseInt(pageLimit) * (page - 1))
      .exec();
      const subject = "User Password";
      const text =  "Your otp is "+ defaultPassword;
      await sendMail(email, subject, text);
      return res.status(200).json({
      success: true,
      msg: "Details saved",
      data: { staffs,},
    });                                    
  } catch (error) {
    winston.error(error);
  }
};

exports.searchCaptain = async (req, res) => {
  try{
   const { query } = req.query;
   const captains = await Staff.find({'staffRole': 'captain'}).exec();
   if (!captains) return res.status(200).json({ error: "No captain(s) found" });
 
   let filter_captains = [];
  
   if (query) {
    captains.forEach((f) => {
       let query_lowercase = query.toLowerCase();
       if (
        f.username && f.username.toLowerCase().includes(query_lowercase) ||
        f.email && f.email.toLowerCase().includes(query_lowercase) ||
        f.status && f.status.toLowerCase().includes(query_lowercase)
       ) {
        filter_captains.push(f);
       }
     });
   } else {
    filter_captains = [...captains];
   }
   return res.status(200).json({ success: true, data: { captains: filter_captains } });
}
catch (error) {
  return res.status(500).json({error: 'Internal server error'})
}
};

exports.getManagerList = async (req, res) => {
  try {
     const managers = await Manager.find({})
        .sort({ created_at: -1 })
        .exec();
      return res
      .status(200)
      .json({ success: true, data: { managers } });
  } catch (error) {
    winston.error(error);
    return res.status(500).json({ error: error.message });
  }
}

exports.getSubscriptionOfUser = async (req, res) => {
  try {
    let { terms } = req.body;

    let subscription = await Subscription.find({}).exec();


    return res
      .status(200)
      .json({ 
        success: true, 
        msg: "Terms & conditions content updated",
        data: subscription
       });
  } catch (error) {
    winston.error(error);
  }
};