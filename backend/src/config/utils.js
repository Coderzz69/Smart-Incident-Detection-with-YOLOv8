import jwt from "jsonwebtoken";
import ENV from "./env.js";

export const generateToken = (userId, res) => {

    const token = jwt.sign({userId}, ENV.JWT_SECRET, {expiresIn:"7d"});

    res.cookie("jwt", token, {
        maxAge:7*24*60*60*1000,     //IN millisecond
        httpOnly: true,     //prevent XSS attacks cross-site scripting attacks (it makes so that javascript can't use it)
        sameSite: "strict",     //CRSF attacks cross-site request forgery attacks
        secure: ENV.NODE_ENV !== "development"
    });

    return token;
};