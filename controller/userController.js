import bcrypt from "bcrypt";
import User from "../models/userSchema.js";
import cloudinary from "../config/cloudinaryconfig.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import OtpModel from "../models/otpModel.js";
dotenv.config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_ID,
    pass: process.env.MAIL_PASS,
  },
});

const userController = {
  registerUser: async (req, res) => {
    try {
      const { name, username, email, password } = req.body;

      const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

      const mailOptions = {
        from: '"twitter" <shivamdubeyfd@gmai.com>',
        to: email,
        subject: "Verify Your Email Address for twitter",
        html: `
          Hi ${name},
          Thank you for registering with twitter!
          To activate your account, please enter otp ${otp}
        `,
      };

      const hashedPassword = await bcrypt.hash(password, 10);


      const newUser = new User({
        name: name,
        username: username,
        password: hashedPassword,
        email: email,
      });

      const savedUser = await newUser.save();

      const token = jwt.sign({ userId: savedUser._id }, "shivam");
      if(!savedUser){
        res.json({message:"Enter Unique username"})
       }

       res.cookie("signuptoken", token, {
      
        httpOnly: false, // Prevent client-side JavaScript from accessing the cookie
        secure: true, // Ensure the cookie is sent over HTTPS
        sameSite: 'None', // Allow cross-site cookies
        maxAge: 3 * 60 * 60 * 1000, // 3 hours
        
      }).json({ message: "signup successful" });
   
      const newOtpVerification = new OtpModel({
        userId: savedUser._id,
        otp: otp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 36000,
      });

      await newOtpVerification.save();
    
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          return res
            .status(500)
            .json({ message: "Error sending verification email" });
        }
        console.log("Verification email sent:", info.response);
        res
          .status(200)
          .json({ message: "Please check your email for verification link" });
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
  userLogin: async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({ username: username });
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log("password",isPasswordValid)
      console.log(user);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Authentication failed" });
      }

      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      if (user) {

      const token = jwt.sign({ username: username }, "shivam");
      res.cookie("token", token, {
      
        httpOnly: false, // Prevent client-side JavaScript from accessing the cookie
        secure: true, // Ensure the cookie is sent over HTTPS
        sameSite: 'None', // Allow cross-site cookies
        maxAge: 3 * 60 * 60 * 1000, // 3 hours
        
        
      });

      res.cookie("token", token, {
        httpOnly: false,
        secure: true,
        sameSite: 'None',
        maxAge: 3 * 60 * 60 * 1000,
        path: '/', // Ensures the cookie is available throughout the site
        domain: 'https://twitter-frontend-bice-nine.vercel.app', // Adjust as needed to match your domain
      });

      res.cookie("username",username, {
      
        httpOnly: false,
        secure: true,
        sameSite: 'None',
        maxAge: 3 * 60 * 60 * 1000,
        path: '/', // Ensures the cookie is available throughout the site
        domain: 'https://twitter-frontend-bice-nine.vercel.app', // Adjust as needed to match your domain
        
      }).json({ message: "Login successful",code:"login" });

    
     
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }

  },
  verifyOTP: async (req, res) => {
    try {
      const { otp } = req.body;
    

      const token = req.cookies.signuptoken;
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const userId = decodedToken.userId;

      const otpRecord = await OtpModel.findOne({ userId: userId });

      if (!otpRecord) {
        await User.deleteOne({ _id: userId });
        return res.status(400).json({ message: "OTP record not found",code:"invalid" });
      }

      if (otpRecord.expiresAt < Date.now()) {
        await User.deleteOne({ _id: userId });
        return res.status(400).json({ message: "OTP has expired" });
      }

      if (otpRecord.otp !== otp) {
        await User.deleteOne({ _id: userId });
        return res.status(400).json({ message: "Invalid OTP",code:"invalid" });
      }

      await User.findByIdAndUpdate(userId, { $set: { verified: true } });

      await OtpModel.deleteOne({ userId: userId });

      return res.status(200).json({ message: "OTP Verified",code:"otp" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
  Logout: async (req, res) => {
    try {
      res.clearCookie("token");
      res.status(200).json({ message: "Logout successful" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
};

export default userController;
