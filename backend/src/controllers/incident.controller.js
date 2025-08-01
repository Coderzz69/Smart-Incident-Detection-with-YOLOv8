import axios from "axios";

export const incidentController = async (req, res) => {
  try {
    const { cameraImages } = req.body; // Expecting an array of { cameraId, image (base64) }

    if (!cameraImages || !Array.isArray(cameraImages) || cameraImages.length === 0) {
      return res.status(400).json({ message: "cameraImages array is required" });
    }

    // 🔁 Forward all images to your Azure-hosted model
    const azureRes = await axios.post("https://your-azure-site.azurewebsites.net/api/analyze", {
      cameraImages,
    });

    // 🔁 Forward Azure's response to frontend
    return res.json(azureRes.data);

  } catch (err) {
    console.error("Error forwarding to Azure:", err?.message || err);
    return res.status(500).json({ message: "Failed to process camera images" });
  }
};
