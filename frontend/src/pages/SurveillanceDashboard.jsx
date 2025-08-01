import { useState, useEffect, useRef } from "react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const SurveillanceDashboard = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(50); // ms between analyses
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analysisTimerRef = useRef(null);

  const chartData = [
    { type: "Fire", present: result?.fire ? 1 : 0 },
    { type: "Smoke", present: result?.smoke ? 1 : 0 },
  ];

  // Start/stop camera
  const toggleCamera = async () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      toast.error("Could not access camera: " + err.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    stopAutoAnalysis();
  };

  // Capture image from camera
  const captureImage = () => {
    if (!isCameraActive) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg');
  };

  // Analyze captured image
  const handleAnalyze = async () => {
    if (!isCameraActive) return toast.error("Please activate camera first.");
    if (loading) return;

    const imageData = captureImage();
    if (!imageData) return;

    setLoading(true);
    try {
      const res = await axiosInstance.post("/incident/detect", { image: imageData });
      setResult(res.data);
        
    } catch (err) {
      console.error(err);
      toast.error("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-analysis functions
  const startAutoAnalysis = () => {
    if (!isCameraActive) return;
    setAutoAnalyze(true);
    analysisTimerRef.current = setInterval(handleAnalyze, analysisInterval);
  };

  const stopAutoAnalysis = () => {
    setAutoAnalyze(false);
    if (analysisTimerRef.current) {
      clearInterval(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
  };

  const toggleAutoAnalyze = () => {
    if (autoAnalyze) {
      stopAutoAnalysis();
    } else {
      startAutoAnalysis();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopAutoAnalysis();
    };
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Real-time Surveillance Analyzer</h1>

      <div className="border p-4 rounded shadow mb-4">
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={toggleCamera}
            className={`px-4 py-2 rounded ${isCameraActive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            {isCameraActive ? "Stop Camera" : "Start Camera"}
          </button>
          
          <button
            onClick={handleAnalyze}
            disabled={!isCameraActive || loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Now"}
          </button>

          <button
            onClick={toggleAutoAnalyze}
            disabled={!isCameraActive}
            className={`px-4 py-2 rounded ${autoAnalyze ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white disabled:opacity-50`}
          >
            {autoAnalyze ? "Stop Auto-Analysis" : "Start Auto-Analysis"}
          </button>
        </div>

        <div className="relative bg-black rounded overflow-hidden mb-4">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-auto max-h-96 mx-auto"
            style={{ display: isCameraActive ? 'block' : 'none' }}
          />
          {!isCameraActive && (
            <div className="w-full h-64 bg-gray-800 flex items-center justify-center text-white">
              Camera is inactive
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label>Analysis Interval (ms):</label>
          <input 
            type="number" 
            value={analysisInterval} 
            onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setAnalysisInterval(isNaN(value) ? 2000 : Math.max(500, value));
                }}
            min="500"
            step="500"
            className="border p-1 rounded w-24"
            disabled={autoAnalyze}
          />
        </div>
      </div>

      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Incident Details</h2>
          <ul className="list-disc pl-5 mb-4">
            <li><strong>Fire:</strong> {result.fire ? "Detected" : "Not Detected"}</li>
            <li><strong>Smoke:</strong> {result.smoke ? "Detected" : "Not Detected"}</li>
            <li><strong>Location:</strong> {result.location || "Unknown"}</li>
            <li><strong>Alert:</strong> {result.alert || "None"}</li>
            <li><strong>Last analyzed:</strong> {new Date().toLocaleTimeString()}</li>
          </ul>

          {/* Display the annotated image */}
          {result.image_annotated && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Annotated Image</h2>
              <img 
                src={`data:image/jpeg;base64,${result.image_annotated}`} 
                alt="Annotated Analysis" 
                className="max-h-96 rounded mx-auto"
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