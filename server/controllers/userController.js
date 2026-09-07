import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// API to register user
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.json({ success: false, message: "User already exists" });
        }

        const user = await User.create({ name, email, password });
        const token = generateToken(user._id);

        res.json({ success: true, token });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// API to login user
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                const token = generateToken(user._id);
                return res.json({ success: true, token });
            }
        }

        return res.json({ success: false, message: "Invalid email or password" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// API to get the currently logged-in user's data
// Expects an "Authorization: Bearer <token>" header (this is what
// AppContext.jsx sets via axios.defaults.headers.common)
export const getUser = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.json({ success: false, message: "Not authorized, no token" });
        }

        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        return res.json({ success: true, user });
    } catch (error) {
        // Covers expired/invalid tokens (jwt.verify throws) as well as DB errors
        return res.json({ success: false, message: error.message });
    }
}
// API to get published images
export const getPublishedImages = async (req, res) => {
    try {
        const publishedImageMessages = await Chat.aggregate([
            { $unwind: "$messages" },
            {
                $match: {
                    "messages.isImage": true,
                    "messages.isPublished": true
                }
            },
            {
                $project: {
                    _id: 0,
                    imageUrl: "$messages.content",
                    userName: "$userName"
                }
            }
        ])

        res.json({ success: true, images: publishedImageMessages.reverse() })
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}