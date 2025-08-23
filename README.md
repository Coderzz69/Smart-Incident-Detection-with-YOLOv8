# Smart Incident Detection with YOLOv8

This is a full-stack application for real-time incident detection using a webcam. It can detect fire, smoke, and crowd density, providing a comprehensive dashboard for monitoring and alerts.

## 🌟 Key Features

- **Real-time Video Analysis**: Captures video from a webcam for continuous monitoring.
- **Multi-Threat Detection**: Uses YOLOv8 models to detect:
    - 🔥 Fire
    - 💨 Smoke
    - 👥 Crowd Density
- **Interactive Dashboard**: A comprehensive user interface to view live feeds, analysis results, and incident history.
- **Alert System**: Notifies officials with toast notifications for critical events.
- **Incident Mapping**: Visualizes the location of incidents on a map.
- **Full-Stack Architecture**: Built with a React frontend, Node.js backend, and a Flask-powered machine learning server.

## 🏗️ Architecture

The application is composed of three main parts:

1.  **Frontend**: A React application built with Vite that provides the user interface. It captures video from the user's webcam, sends frames for analysis, and displays the results on an interactive dashboard.
2.  **Backend**: A Node.js server using Express that acts as a proxy between the frontend and the machine learning server. It handles API requests from the frontend and forwards them to the Flask backend.
3.  **Machine Learning Backend**: A Python server using Flask and YOLOv8 for object detection. It receives images from the Node.js backend, performs inference to detect fire, smoke, and crowds, and returns the analysis results.

*An architecture diagram will be added here.*

## 🛠️ Setup and Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [Python](https://www.python.org/) (v3.8 or later)
- [pip](https://pip.pypa.io/en/stable/installation/)

### 1. Clone the Repository

```bash
git clone https://github.com/Coderzz69/Smart-Incident-Detection-with-YOLOv8.git
cd Smart-Incident-Detection-with-YOLOv8
```

### 2. Setup the Machine Learning Backend (Flask)

```bash
cd Flask_Backend
pip install -r requirements.txt
# or
# pip install flask opencv-python-headless ultralytics numpy

# Start the Flask server
python app.py
```
The ML server will start on `http://localhost:5001`.

### 3. Setup the Backend (Node.js)

```bash
cd ../backend
npm install

# Create a .env file and add the following:
# PORT=3000

npm start
```
The Node.js server will start on `http://localhost:3000`.

### 4. Setup the Frontend (React)

```bash
cd ../frontend
npm install

# Start the development server
npm run dev
```
The React application will be available at `http://localhost:5173`.

##  API Documentation

### POST /api/incident/detect

This is the main endpoint for analyzing an image. It is handled by the Node.js backend, which forwards the request to the Flask server.

**Request Body:**

```json
{
  "image": "data:image/jpeg;base64,..."
}
```

- `image`: A base64-encoded data URL of the image to be analyzed.

**Response Body:**

```json
{
  "annotated_img_base64": "...",
  "fire_count": 0,
  "smoke_count": 0,
  "alertType": "None",
  "location": "E Block",
  "crowd_annotated_img_base64": "...",
  "crowd_density": 0.123
}
```
- `annotated_img_base64`: Base64-encoded image with fire/smoke detections.
- `fire_count`: Number of fire instances detected.
- `smoke_count`: Number of smoke instances detected.
- `alertType`: The type of alert ("None", "Fire", "Crowd").
- `location`: The hardcoded location of the incident.
- `crowd_annotated_img_base64`: Base64-encoded image with crowd detections.
- `crowd_density`: A numeric value representing the crowd density.

## ⚙️ Configuration

### Frontend

The frontend needs to know the URL of the Node.js backend. This is configured in `frontend/src/lib/axios.js`:

```javascript
export const axiosInstance = axios.create({
    baseURL: "http://localhost:3000/api"
});
```

### Backend

The Node.js backend needs to know the URL of the Flask ML server. This is hardcoded in `backend/src/controllers/incident.controller.js`:

```javascript
const response = await axios.post("http://10.100.11.203:5001/detect", {
  img_base64: base64Image,
});
```
Make sure to change this URL to `http://localhost:5001/detect` if you are running the Flask server locally.
