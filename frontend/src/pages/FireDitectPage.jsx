// src/pages/FireDetectPage.jsx
import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";

const FireDetectPage = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [fireDetected, setFireDetected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) return toast.error("No image selected");

    setLoading(true);
    try {
      const res = await axiosInstance.post("/incident/detect", {
        image: selectedImage,
      });
      setFireDetected(res.data.fireDetected);
      toast.success(res.data.fireDetected ? "🔥 Fire Detected!" : "✅ No Fire Detected");
    } catch (error) {
      toast.error("Error detecting fire");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex justify-center items-center min-h-[80vh] bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">🔥 Fire Detection</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-left font-medium mb-1" htmlFor="image">
              Upload Image
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {selectedImage && (
            <div className="text-center">
              <img
                src={selectedImage}
                alt="Preview"
                className="max-h-64 mx-auto rounded-md border mt-2"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            {loading ? "Detecting..." : "Upload & Detect"}
          </button>
        </form>

        {fireDetected !== null && (
          <div className="mt-6 text-center text-lg font-semibold">
            {fireDetected ? (
              <span className="text-red-600">🔥 Fire Detected!</span>
            ) : (
              <span className="text-green-600">✅ No Fire Detected</span>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default FireDetectPage;
