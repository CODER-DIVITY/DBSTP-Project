import React from "react";
import TrafficPrediction from "./TrafficPrediction";  // Adjust the path based on the location
// Import Leaflet CSS in your App.js or index.js (if not already included)
import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <div className="App">
      <h1>Welcome to the Traffic Congestion Prediction App</h1>
      <TrafficPrediction />
    </div>
  );
}

export default App;





