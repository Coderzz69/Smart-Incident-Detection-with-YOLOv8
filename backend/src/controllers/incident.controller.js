import axios from "axios";

export const incidentController = async (req, res) => {
  try {
    const { image } = req.body;


    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const base64Image = image.split(',')[1]; // Remove 'data:image/jpeg;base64,'

    const response = await axios.post("http://10.100.11.203:5001/detect", {
      img_base64: base64Image,  // ✅ matches Python's expected key
    });

    return res.json(response.data);
  } catch (err) {
    console.error("Error processing image:", err.response?.data || err.message);
    return res.status(500).json({ message: "Failed to analyze image" });
  }
};
