import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import User from "../Models/User.js";

export const signupUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const emailLower = email.toLowerCase();

        const existingUser = await User.findOne({ email: emailLower });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists", success: false });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email: emailLower,
            password: hashedPassword
        });

        await newUser.save();

        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({ 
            message: "Signup successful", 
            success: true,
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Server error", success: false });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const emailLower = email.toLowerCase();

        const user = await User.findOne({ email: emailLower });
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials", success: false });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ 
            message: "Login successful", 
            success: true, 
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error", success: false });
    }
};