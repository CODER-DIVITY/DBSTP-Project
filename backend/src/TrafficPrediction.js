import React, { useState, useEffect } from "react";
import axios from "axios";
import L from "leaflet"; // Importing leaflet for map
import "leaflet/dist/leaflet.css"; // Importing the Leaflet CSS

const TOMTOM_API_KEY = "E8bf9eoTODXg7NgSzVqI1dW2YYS21ylw"; // Replace with your actual TomTom API key
const TOMTOM_TRAFFIC_API_URL = "https://api.tomtom.com/traffic/services/4/incidentDetails";

const TrafficPrediction = () => {
  const [trafficSpeed, setTrafficSpeed] = useState("");
  const [density, setDensity] = useState("");
  const [temperature, setTemperature] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [predictionClass, setPredictionClass] = useState(null);
  const [congestionLabel, setCongestionLabel] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if map container exists before initializing the map
    if (document.getElementById("map") && !window.map) {
      const map = L.map("map").setView([51.505, -0.09], 13); // Default map view (change as needed)

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

      // Save the map instance globally so it doesn't reinitialize
      window.map = map;

      // Add a click event to the map
      map.on("click", async (event) => {
        const lat = event.latlng.lat;
        const lon = event.latlng.lng;
        console.log(`Lat: ${lat}, Lon: ${lon}`);

        // Fetch traffic data based on the lat/lon
        try {
          const response = await axios.get(TOMTOM_TRAFFIC_API_URL, {
            params: {
              key: TOMTOM_API_KEY,
              lat: lat,
              lon: lon
            }
          });

          // Handle the response and update the fields
          if (response.data) {
            const trafficData = response.data; // Adjust based on API response structure
            console.log(trafficData);

            // Update fields with fetched data (Assume response data has speed, density, and temperature)
            setTrafficSpeed(trafficData.speed || 0);
            setDensity(trafficData.density || 0);
            setTemperature(trafficData.temperature || 0);
          }
        } catch (err) {
          console.error("Error fetching traffic data:", err);
          setError("Failed to fetch real-time traffic data.");
        }
      });
    }

    // Cleanup function to remove the map container on component unmount
    return () => {
      if (window.map) {
        window.map.remove();
        window.map = null; // Clear the global map object
      }
    };
  }, []); // Empty dependency array ensures this effect only runs once

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setPrediction(null); // Clear previous predictions
    setPredictionClass(null); // Clear previous class
    setCongestionLabel(null); // Clear previous label

    try {
      // Parse traffic speed, density, and temperature as floats before sending
      const response = await axios.post("http://127.0.0.1:8000/predict", {
        traffic_speed: parseFloat(trafficSpeed),  // Ensure the value is a float
        density: parseFloat(density),  // Ensure the value is a float
        temperature: parseFloat(temperature),  // Ensure the value is a float
      });

      // Handle the prediction result
      if (response.data && response.data.predicted_congestion_level !== undefined) {
        setPrediction(response.data.predicted_congestion_level);
        setPredictionClass(response.data.predicted_class);
        setCongestionLabel(response.data.congestion_label);
      } else {
        setError("Unexpected response from the server.");
      }
    } catch (err) {
      console.error("Error fetching prediction:", err);
      setError("Failed to fetch prediction. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      <h1>Traffic Congestion Predictor</h1>
      
      {/* Map Container */}
      <div id="map" style={{ height: "400px", marginBottom: "20px" }}></div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Traffic Speed (km/h): </label>
          <input
            type="number"
            value={trafficSpeed}
            onChange={(e) => setTrafficSpeed(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Density: </label>
          <input
            type="number"
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Temperature (°C): </label>
          <input
            type="number"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            required
          />
        </div>
        <button type="submit">Predict</button>
      </form>

      {/* Prediction Output */}
      {prediction !== null && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "1px solid #ccc",
          }}
        >
          <h3>Predicted Congestion Level:</h3>
          <p>{prediction.toFixed(2)}</p>
          <h3>Congestion Class:</h3>
          <p>{predictionClass}</p>
          <h3>Congestion Label:</h3>
          <p>{congestionLabel}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "1px solid red",
            color: "red",
          }}
        >
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default TrafficPrediction;




//const TOMTOM_API_KEY = "E8bf9eoTODXg7NgSzVqI1dW2YYS21ylw"; // Replace with your actual TomTom API key
  

