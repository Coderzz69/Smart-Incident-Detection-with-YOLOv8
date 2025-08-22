# Smart Incident Detection with YOLOv8

This project is a full-stack web application designed for smart surveillance and incident detection. It leverages the power of YOLOv8 for real-time object detection to identify fires, smoke, and crowd density from video streams or images. The application features a comprehensive dashboard for monitoring, threat assessment, and incident management.

## 🚀 Features

-   **Real-time Surveillance**: Utilizes the device's camera for live monitoring.
-   **AI-Powered Detection**:
    -   🔥 **Fire Detection**: Identifies active fires.
    -   💨 **Smoke Detection**: Detects smoke, often an early indicator of fire.
    -   👥 **Crowd Analysis**: Measures crowd density to identify potential congestion or overcrowding.
-   **Threat Assessment**: Provides a summary of detected threats and suggests responsive actions.
-   **Interactive Dashboard**:
    -   Live camera feed with manual and automatic analysis modes.
    -   Displays detection results, including annotated images.
    -   Incident logging to track historical data.
    -   Interactive map to visualize incident locations.
-   **User-Friendly Interface**: A clean and intuitive UI built with React.
-   **Scalable Architecture**: A decoupled frontend, backend, and ML service for better scalability and maintainability.

## 🛠 Tech Stack

-   **Frontend**: React, Vite, Tailwind CSS, Zustand, React-Leaflet
-   **Backend**: Node.js, Express
-   **ML Service**: Python, Flask, YOLOv8, OpenCV
-   **Database**: MongoDB (inferred from `db.js`)

## 🏛️ Architecture

The application consists of three main components:

1.  **Frontend**: A React application that provides the user interface. It communicates with the Node.js backend to send images/video frames for analysis and display the results.
2.  **Backend (Node.js)**: An Express server that acts as a middleware between the frontend and the Flask ML service. It handles API requests, user authentication, and proxies analysis requests to the Flask service.
3.  **ML Service (Flask)**: A Python-based service that performs the heavy lifting of object detection. It uses YOLOv8 models to analyze images and returns the detection results (fire, smoke, crowd count) to the Node.js backend.

```
┌──────────┐      ┌─────────────────┐      ┌──────────────────┐
│  Frontend  │◄───►│  Backend (Node.js)  │◄───►│  ML Service (Flask)  │
│  (React)   │      │     (Express)     │      │      (YOLOv8)      │
└──────────┘      └─────────────────┘      └──────────────────┘
```

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (v14 or later)
-   [Python](https://www.python.org/) (v3.8 or later)
-   [MongoDB](https://www.mongodb.com/) (for the backend database)

## ⚙️ Installation & Setup

Follow these steps to set up the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Coderzz69/Smart-Incident-Detection-with-YOLOv8.git
cd Smart-Incident-Detection-with-YOLOv8
```

### 2. Setup the Backend (Node.js)

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory and add the following environment variables:

```
PORT=3000
MONGO_URI=<your_mongodb_connection_string>
```

### 3. Setup the ML Service (Flask)

```bash
cd Flask_Backend
pip install -r requirements.txt
```

The required YOLOv8 models (`crowdBest.pt` and `fire_model.pt`) are included in this directory.

### 4. Setup the Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory and add the following environment variable to point to your backend server:

```
VITE_API_URL=http://localhost:3000
```

## ▶️ Running the Application

You need to start all three services in separate terminal windows.

### 1. Start the ML Service (Flask)

```bash
cd Flask_Backend
python app.py
```

The Flask service will be running at `http://localhost:5001`.

### 2. Start the Backend (Node.js)

```bash
cd backend
npm start
```

The Node.js backend will be running at `http://localhost:3000`.

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

The React frontend will be running at `http://localhost:5173`. You can now access the application in your browser.

## 📄 API Endpoints

The primary API endpoint exposed by the Node.js backend is:

-   `POST /api/incident/detect`: Forwards an image to the ML service for analysis.
    -   **Request Body**: `{ "image": "<base64_encoded_image>" }`
    -   **Response**: A JSON object with detection results (fire count, smoke count, crowd density, annotated images).

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
