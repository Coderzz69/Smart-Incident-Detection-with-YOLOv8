import io
import base64
import numpy as np
from flask import Flask, request, jsonify
from ultralytics import YOLO
import cv2

app = Flask(__name__)

# Load the YOLOv8 models
crowd_model = YOLO("crowdBest.pt")   # Replace with your crowd model path
fire_model = YOLO("fire_model.pt")   # Replace with your fire/smoke model path

def base64_to_cv2(base64_str):
    img_bytes = base64.b64decode(base64_str)
    img_np = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(img_np, cv2.IMREAD_COLOR)

def cv2_to_base64(img):
    _, buffer = cv2.imencode('.jpg', img)
    img_bytes = buffer.tobytes()
    return base64.b64encode(img_bytes).decode('utf-8')


@app.route('/detect', methods=['POST'])
def detect():
    try:
        data = request.json
        if 'img_base64' not in data:
            return jsonify({'error': 'img_base64 not found in request'}), 400

        # Decode input image
        frame = base64_to_cv2(data['img_base64'])

        # Run YOLOv8 inference
        results = crowd_model(frame)

        # Count number of people (class 'person')
        person_count = 0
        for box in results[0].boxes:
            cls_id = int(box.cls)
            class_name = crowd_model.names[cls_id].lower()
            if class_name == "people":
                person_count += 1

        # Calculate crowd density (people per pixel)
        h, w = frame.shape[:2]
        area = h * w if h > 0 and w > 0 else 1
        crowd_density = round(person_count / area, 6) * 50000 #> 0.00005

        # Annotate image
        annotated = results[0].plot()

        # Encode annotated image back to base64
        output_base64 = cv2_to_base64(annotated)

        data = request.json
        if 'img_base64' not in data:
            return jsonify({'error': 'img_base64 not found in request'}), 400
        # Decode input image
        frame = base64_to_cv2(data['img_base64'])
        # Run YOLOv8 inference
        results = fire_model(frame)
        alertType = ""
        # Count fire and smoke detections with conf > 0.7
        fire_count = 0
        smoke_count = 0
        for box in results[0].boxes:
            cls_id = int(box.cls)
            conf = float(box.conf)
            class_name = fire_model.names[cls_id].lower()
            if class_name == "smoke" and conf > 0.55:
                alertType = "Caution: Smoke Detected" if conf > 0.6 else "Warning: Smoke Detected"
                smoke_count += 1
            if class_name == "fire" and conf > 0.55:
                alertType = "Emergency: Fire Detected" if conf > 0.6 else "Warning: Fire Detected"
                fire_count += 1
        # Annotate image
        annotated = results[0].plot()
        # Encode annotated image back to base64
        output_base64_fire = cv2_to_base64(annotated)
        return jsonify({
            'annotated_img_base64': output_base64_fire,
            'fire_count': fire_count,
            'smoke_count': smoke_count,
            'alertType': alertType,
            "location": "E Block",
            'crowd_annotated_img_base64': output_base64,
            'crowd_density': crowd_density
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
