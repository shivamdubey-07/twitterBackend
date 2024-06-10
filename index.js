import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import cloudinary from "./config/cloudinaryconfig.js";
import cookieParser from "cookie-parser";
import  {verifyToken}  from "./middleware/userAuthenticate.js";

// import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';


// import userRoutes from "./routes/userRoutes.js"
import controller from "./controller/userController.js";
import{userData} from "./controller/userData.js";

import nodemailer from "nodemailer";
import crypto from "crypto";
import User from "./models/userSchema.js";

const app = express();
const corsOptions = {
  origin:"http://localhost:3000",
  credentials: true,
};
app.use(cors(corsOptions));
const PORT = process.env.PORT || 9001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(bodyParser.json({ limit: "100mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(morgan("common"));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// importing the db connection from db file
import("./config/db.js");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     return cb(null, "/uploads");
//   },
//   filename: function (req, file, cb) {
//     return cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage });

// user auth endpoints

// multer cloudinary
dotenv.config(); // Load environment variables

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: (req, file) => `users/${req.body.username}`, // Save files in a user-specific folder
//     public_id: (req, file) => Date.now().toString(), // Optional - specify file name
//   },
// });
// storage.filename = function (req, file, cb) {
  
//     if (err) return cb(err);
//     cb(null, raw.toString('hex') + path.extname(file.originalname));
//     cb(null, `${Date.now()}-${file.originalname}`);
  
// };

// const upload = multer({ storage });

const upload = multer({ dest: 'uploads/' });


app.use(
  "/api/register",
  upload.single("profileimage"),
  controller.registerUser
);
app.use("/api/otp", controller.verifyOTP);
app.use("/api/verify-email", async (req, res) => {
  const token = req.query.token;
  console.log(token,"verfov");
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    user.verified = true;
    user.verificationToken = undefined; // Remove token after verification
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verifying email" });
  }
});
app.use("/api/login", controller.userLogin);


// app.use("/api/Home",verifyToken,userAuthenticate);
app.get("/",verifyToken,(req,res)=>{
  console.log("aa gya hu bc",req.user)
  res.json({message:"hello"})
});
app.patch("/api/user/profileUpdate",verifyToken,upload.single('file'), userData.updateProfile);
app.use("/api/user/posts",verifyToken, userData.getAllfollowingPosts);
app.post("/api/user/post",verifyToken,upload.single('file'),userData.postTweet);
app.post("/api/user/delete",userData.deleteTweet);
app.patch("/api/user/updateTweet",verifyToken,upload.single('file'),userData.updateTweet);
app.get("/api/user/myProfile",verifyToken,userData.getMyProfile);
app.patch("/api/user/profileUpdate",verifyToken,upload.single('file'),userData.updateProfile);
app.get("/api/user/userDetails",verifyToken,userData.getuserDetails);
app.patch("/api/user/follow",verifyToken,userData.followUser);
app.patch("/api/user/unfollow",verifyToken,userData.unFollowUser);
app.get("/api/user/allFollowingPosts",verifyToken,userData.getAllfollowingPosts);
app.get("/api/user/followers",verifyToken,userData.getFollowers);
app.get("/api/user/following",verifyToken,userData.getFollowing);
app.post("/api/user/searchUser",verifyToken,userData.searchUser)


// app.use("/api/users/posts/:id",userAuthenticate,controller.getUserPost);
app.listen(process.env.PORT, () => {
  console.log("The server is running on ");
});
