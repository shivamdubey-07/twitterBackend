import mongoose from "mongoose";
import dotenv from 'dotenv'


const PORT =process.env.PORT || 9001;
dotenv.config();


mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    console.log("Database is Connected");
})
.catch((err)=>{
    console.log("DATABASE ERROR =>",err);
})


