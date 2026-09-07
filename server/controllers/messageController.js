
import axios from "axios";
import FormData from "form-data";
import Chat from "../models/Chat.js";
import User from "../models/user.js";
import imagekit from "../configs/imagekit.js";
import openai from "../configs/openai.js"; // adjust the path/name if yours differs

// Text-based AI Chat Message Controller
export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id;
        const { chatId, prompt } = req.body;

        const chat = await Chat.findOne({ userId, _id: chatId });
        chat.messages.push({ role: "user", content: prompt, timestamp: Date.now(), isImage: false });

        const { choices } = await openai.chat.completions.create({
            model: "gemini-3.7-flash",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const reply = { ...choices[0].message, timestamp: Date.now(), isImage: false };
        res.json({ success: true, reply });

        chat.messages.push(reply);
        await chat.save();
        await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Image Generation Message Controller
export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id;

        // Check credits
        if (req.user.credits < 2) {
            return res.json({ success: false, message: "You don't have enough credits to use this feature" });
        }

        const { prompt, chatId, isPublished } = req.body;

        // Find chat
        const chat = await Chat.findOne({ userId, _id: chatId });

        // Push user message
        chat.messages.push({
            role: "user",
            content: prompt,
            timestamp: Date.now(),
            isImage: false,
        });

        // Build the request to ClipDrop's text-to-image API
        const formData = new FormData();
        formData.append("prompt", prompt);

        const aiImageResponse = await axios.post(
            "https://clipdrop-api.co/text-to-image/v1",
            formData,
            {
                headers: {
                    "x-api-key": process.env.CLIPDROP_API_KEY,
                    ...formData.getHeaders(),
                },
                responseType: "arraybuffer",
            }
        );

        // Convert to Base64
        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data, "binary").toString("base64")}`;

        // Upload to ImageKit Media Library
        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "SkinAffairs",
        });

        const reply = {
            role: "assistant",
            content: uploadResponse.url,
            timestamp: Date.now(),
            isImage: true,
            isPublished: Boolean(isPublished),
        };

        res.json({ success: true, reply });

        chat.messages.push(reply);
        await chat.save();
        await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};