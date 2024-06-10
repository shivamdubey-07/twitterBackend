import mongoose from "mongoose";
const Schema = mongoose.Schema;

const otpSchema = new Schema({
  userId:{type:String},
  otp: { type: String},
  createdAt:Date,
  expiresAt:Date

},{
    timestamps:true
});


const Otp = mongoose.model("Otp", otpSchema);
export default Otp;