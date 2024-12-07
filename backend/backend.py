from fastapi import FastAPI
from pydantic import BaseModel
import torch
import torch.nn as nn
import logging
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow all origins (change this in production for security)
app.add_middleware(
    CORSMiddleware,
    #allow_origins=["http://localhost:3000"], # Frontend URL

    allow_origins=["*"],  # Allows all origins; change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Define the LSTM-CNN model class (same as used during training)
class LSTMCNN(nn.Module):
    def __init__(self, input_dim, hidden_dim, lstm_layers, cnn_out_channels, output_dim):
        super(LSTMCNN, self).__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers=lstm_layers, batch_first=True)
        self.cnn = nn.Conv1d(in_channels=1, out_channels=cnn_out_channels, kernel_size=3, stride=1, padding=1)
        self.fc1 = nn.Linear(hidden_dim * cnn_out_channels, 64)
        self.fc2 = nn.Linear(64, output_dim)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = x.unsqueeze(1)
        lstm_out, _ = self.lstm(x)
        cnn_out = self.cnn(lstm_out)
        cnn_out = cnn_out.view(cnn_out.size(0), -1)
        x = self.relu(self.fc1(cnn_out))
        x = self.fc2(x)
        return x

# Load the trained model
input_dim = 8  # Number of features
model = LSTMCNN(input_dim=40, hidden_dim=32, lstm_layers=2, cnn_out_channels=16, output_dim=1)
model.load_state_dict(torch.load("lstm_cnn_model.pth"), strict=False)
model.eval()

# Pydantic model for incoming requests
class TrafficFeatures(BaseModel):
    traffic_speed: float
    density: float
    temperature: float

@app.post("/predict")
async def predict(data: TrafficFeatures):
    try:
        # Extract input data
        traffic_speed = data.traffic_speed
        density = data.density
        temperature = data.temperature

        # Calculate congestion level based on traffic flow formula
        density = density/100
        traffic_speed = traffic_speed/100
        q = density * traffic_speed  # Traffic flow (vehicles/hour)

        #v_max = 59.5  # Example max speed (free flow speed)
        #congestion_level = (v_max - traffic_speed) / v_max
        #congestion_level = max(0, min(congestion_level, 1))  # Ensure value is between 0 and 1
        congestion_level = q
        # Determine congestion class (0 = Low, 1 = Severe)
        congestion_class = 1 if congestion_level >= 0.5 else 0

        # Apply rule-based congestion level classification
        if (traffic_speed < 0.2 and density > 0.8) or density > 0.50:
            congestion_label = 'High'
        elif (traffic_speed < 0.5 and density > 0.5) or 0.35 <= density < 45:
            congestion_label = 'Medium'
        else:
            congestion_label = 'Low'

        return {
            "predicted_congestion_level": congestion_level,
            "predicted_class": congestion_class,
            "congestion_label": congestion_label
        }
    except Exception as e:
        logging.error(f"Error during prediction: {str(e)}")
        return {"error": str(e)}
