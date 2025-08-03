import dotenv from "dotenv";

dotenv.config();

const ENV = {
    PORT: process.env.PORT,
    MONGODB: process.env.MONGODB_URI,
    CLOUDINARY_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_SECRET: process.env.CLOUDINARY_API_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};

export default ENV;