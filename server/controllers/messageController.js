
import axios from "axios";
import FormData from "form-data";
import Chat from "../models/Chat.js";
import User from "../models/user.js";
import imagekit from "../configs/imagekit.js";
import openai from "../configs/openai.js"; // adjust the path/name if yours differs

// AI models tried in order — later models only run if an earlier one is
// unavailable/overloaded (503/429). Order = newest → most stable fallback.
const MODEL_CHAIN = ["gemini-3.7-flash", "gemini-3.5-flash", "gemini-flash-latest"];

// Hard cap on photos a user can attach to a single message.
const MAX_IMAGES_PER_MESSAGE = 5;

// Master system prompt: keeps the AI in the role of a skincare expert and
// enforces scope (only skin-related topics) plus medical disclaimers.
const SYSTEM_PROMPT = `You are Skin Affairs, a warm, expert virtual skincare consultant and dermatology assistant.

## Role
- Give practical, evidence-based advice on skincare: routines, product selection and ingredients, acne, dryness, oiliness, sensitivity, hyperpigmentation, ageing, sun protection, body care, and general skin health.
- If the user uploads one or more photos, examine their visible skin and describe what you observe (tone, texture, apparent concerns) and tailor your advice to it. Be honest that photos alone cannot capture everything, and never overclaim what can be diagnosed from an image.

## Boundaries — what you MUST NOT do
- Do not answer questions outside skin care and skin health (e.g. coding, software/website development, maths, homework, cooking, current events, general trivia, or any other topic). Politely decline and steer the user back to skin-related topics.
- Do not diagnose or treat medical conditions, prescribe or recommend prescription medication, or give advice that overrides a doctor. Include a brief disclaimer when relevant: you are not a doctor, and for suspected conditions, infections, rashes, or persistent symptoms the user should consult a licensed dermatologist or healthcare provider.
- Do not encourage unsafe or harmful practices, DIY chemical peels, or misuse of medical products.

## Style
- Be concise, warm, and structured (short paragraphs or bullet lists).
- When needed, ask a single clarifying question (skin type, current routine, products used, etc.) so you can tailor the advice.
- Remind the user that a photo-based assessment is informational and not a medical diagnosis.`;

// Returns true for transient failures (overload / rate-limit) so the model
// chain can fall through to the next model; other errors fail fast.
function isRetryable(error) {
    return error?.status === 503 || error?.status === 429 || /UNAVAILABLE|high demand|rate.?limit|overloaded/i.test(error?.message || "");
}

// Uploads a base64 data URL to ImageKit, returning the public CDN URL used
// for displaying the photo in chat history.
async function uploadImage(base64) {
    const uploadResponse = await imagekit.upload({
        file: base64,
        fileName: `chat-${Date.now()}.png`,
        folder: "SkinAffairs/chat",
    });
    return uploadResponse.url;
}

// Builds the OpenAI-style multimodal message content. Gemini's
// OpenAI-compatible endpoint only accepts inline base64 data URLs for
// images, so the data URLs are passed straight through to the model.
function buildContent(prompt, imageDataUrls) {
    const content = [{ type: "text", text: prompt }];
    for (const dataUrl of imageDataUrls || []) {
        content.push({ type: "image_url", image_url: { url: dataUrl } });
    }
    return content;
}

// Calls the model, retrying the same prompt across MODEL_CHAIN until one
// succeeds. The system prompt is always prepended to enforce the assistant's
// role and scope.
async function createWithFallback(prompt, imageDataUrls) {
    let lastError;
    for (const model of MODEL_CHAIN) {
        try {
            const { choices } = await openai.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: buildContent(prompt, imageDataUrls) },
                ],
            });
            if (choices?.length) return choices[0].message;
            lastError = new Error(`No choices returned for ${model}`);
        } catch (error) {
            lastError = error;
            if (!isRetryable(error)) throw error;
        }
    }
    throw lastError;
}

// Text-based AI Chat Message Controller — supports text-only and text+images.
export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id;
        // `images` holds base64 data URLs from the client; a legacy single
        // `image` field is also accepted for backwards compatibility.
        const { chatId, prompt = "", image, images } = req.body;

        const incoming = image ? [image] : Array.isArray(images) ? images : [];
        if (incoming.length > MAX_IMAGES_PER_MESSAGE) {
            return res.json({ success: false, message: `You can attach up to ${MAX_IMAGES_PER_MESSAGE} images per message.` });
        }

        const chat = await Chat.findOne({ userId, _id: chatId });

        // Persist each photo to ImageKit so the public URLs survive in chat
        // history, but send the original inline data URLs to the model.
        const imageUrls = await Promise.all(incoming.map((img) => uploadImage(img)));

        chat.messages.push({ role: "user", content: prompt, image: imageUrls, timestamp: Date.now(), isImage: false });

        const reply = { ...(await createWithFallback(prompt, incoming)), timestamp: Date.now(), isImage: false };

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
            prompt,
        };

        res.json({ success: true, reply });

        chat.messages.push(reply);
        await chat.save();
        await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};