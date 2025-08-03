import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../config/utils.js";
import cloudinary from "../config/cloudinary.js";

export const signup = async (req, res) => {
    const { firstName, lastName, email, password, phone, company, profilePic  } = req.body;
     try
     {
        if(!firstName || !lastName || !phone || !company || !email || !password)
        {
            return res.status(400).json({message: "All fields are required"})
        }
        //password validation
        if(password.length < 6)
        {
            return res.status(400).json({message: "Password must be at least 6 characters"});
        }

        if(!profilePic)
        {
            return res.status(400).json({message: "Profile pic is required"});
        }

        //email validation
        const user = await User.findOne({email});

        if(user)    return res.status(400).json({ message: "Email already exists"});

        //hash password using bcrypt.js it is like using md5(message digest 5)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            company: company,
            email: email,
            password: hashedPassword,
        });

        if(newUser)
        {
            generateToken(newUser._id, res)
            await newUser.save();

            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            const updatedUser = await User.findByIdAndUpdate(newUser._id, {profilePic:uploadResponse.secure_url}, {new:true});
            //generate json web token here
           
            //status code of 201 something new have been created
            res.status(201).json({
                _id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                phone: newUser.phone,
                company: newUser.company,
                email: newUser.email,
                profilePic: updatedUser.profilePic,
            });
        }
        else
        {
            res.status(400).json({message:"Invalid user data"});
        }
     }
     catch(error)
     {
        console.log("Error in singup controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
     }
};
export const login = async (req, res) => {

    const { email, password,  } = req.body;
    try
    {
        const user = await User.findOne({email});

        if(!user)
        {
            return res.status(400).json({message: "Invalid credentials"});
        }
        
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if(!isPasswordCorrect)
        {
            return res.status(400).json({message: "Invalid credentials"});
        }

        generateToken(user._id, res);

        res.status(200).json(
            {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                company: user.company,
                email: user.email,
                profilePic: user.profilePic,
            });
    }
    catch(error)
    {
        console.log("Error in login controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
};
export const logout = async (req, res) => {
    try
    {
        res.cookie("jwt", "", {maxAge:0});
        res.status(200).json({message: "Logged out successfully"});
    }
    catch(error)
    {
        console.log("Error in logout controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
};

export const updateProfile = async (req, res) => {
    try
    {
        const { profilePic } = req.body;

        const userId = req.user._id;

        if(!profilePic)
        {
            return res.status(400).json({message: "Profile pic is required"});
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic:uploadResponse.secure_url}, {new:true});

        res.status(200).json(updatedUser);
    } 
    catch(error)
    {
        console.log("Error in update profile controller", error.message);
        res.status(500).json({message : "Internal Server Error"});
    }
};

export const checkAuth = async (req, res) => {
    try
    {
        res.status(200).json(req.user);
    }
    catch(error)
    {
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}