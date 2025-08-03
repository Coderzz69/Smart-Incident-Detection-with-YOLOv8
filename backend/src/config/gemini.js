// backend/src/utils/gemini.js
import axios from "axios";
import ENV from "./env.js";

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${ENV.GEMINI_API_KEY}`;

export const analyzeIncidentWithGemini = async ({ camera, timestamp, detection }) => {
  const prompt = `
You are an AI incident analyst. Here's the input:
- Camera: ${camera}
- Timestamp: ${timestamp}
- Detected: ${detection.join(", ")}

Generate:
1. A short summary of the incident.
2. Immediate actions for security, fire, or medical.
3. Risk level: Low, Medium, or High.
  `;

  try {
    const res = await axios.post(GEMINI_API_URL, {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    });

    return res.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  } catch (err) {
    console.error("Gemini error:", err.response?.data || err.message);
    return "Error getting analysis from Gemini";
  }
};
