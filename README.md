# 🔥 Crowd & Fire Detection API using YOLOv8 and Flask

This project is a Flask-based REST API that detects **crowd density**, **fire**, and **smoke** in an input image using two YOLOv8 models: one trained for crowd detection and the other for fire/smoke detection.

---

## 🚀 Features

- Detects and counts people in an image
- Estimates crowd density
- Detects fire and smoke with confidence thresholding
- Returns annotated images (base64)
- Supports JSON API with base64-encoded input

---

## 🧠 Models Used

- `crowdBest.pt` – YOLOv8 model trained to detect people
- `fire_model.pt` – YOLOv8 model trained to detect fire and smoke

> 🔁 Replace these files with your trained `.pt` models.

---

## 🛠 Requirements

Install dependencies using:

```bash
pip install flask opencv-python-headless ultralytics numpy
