import mongoose from "mongoose";
import ENV from "./env.js";

export const connectDB = async() => {
    try
    {
        const conn = await mongoose.connect(ENV.MONGODB);
        console.log(`MongoDB connected : ${conn.connection.host}`);
    }
    catch(error)
    {
        console.log("MongoDB Connection error : ", error);
    }
};