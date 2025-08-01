import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const SurveillanceDashboard = () => {
  const [imageData, setImageData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageData) return toast.error("Please upload an image first.");

    setLoading(true);
    try {
      const res = await axiosInstance.post("/incident/detect", { image: imageData });
      setResult(res.data);
      toast.success("Analysis complete.");
    } catch (err) {
      console.error(err);
      toast.error("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { type: "Fire", present: result?.fire ? 1 : 0 },
    { type: "Smoke", present: result?.smoke ? 1 : 0 },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Surveillance Analyzer</h1>

      <div className="border p-4 rounded shadow mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-2"
        />
        {imageData && (
          <img src={imageData} alt="Uploaded" className="max-h-64 rounded mb-2" />
        )}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Analyzing..." : "Analyze Image"}
        </button>
      </div>

      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Incident Details</h2>
          <ul className="list-disc pl-5 mb-4">
            <li><strong>Fire:</strong> {result.fire ? "Detected" : "Not Detected"}</li>
            <li><strong>Smoke:</strong> {result.smoke ? "Detected" : "Not Detected"}</li>
            <li><strong>Location:</strong> {result.location || "Unknown"}</li>
            <li><strong>Alert:</strong> {result.alert || "None"}</li>
          </ul>

          {/* Display the annotated image */}
          {result.image_annotated && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Annotated Image</h2>
              <img 
                src={`data:image/jpeg;base64,${result.image_annotated}`} 
                alt="Annotated Analysis" 
                className="max-h-96 rounded"
              />
            </div>
          )}

          <h2 className="text-xl font-semibold mb-2">Incident Chart</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SurveillanceDashboard;