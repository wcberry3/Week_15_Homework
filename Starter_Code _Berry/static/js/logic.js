// This function determines the color of the marker based on the depth of the earthquake.
function chooseColor(depth) {
  let color = "#98ee00";

  // If statement on color
  if (depth > 90) {
    color = "#ea2c2c";
  } else if (depth > 70) {
    color = "#ea822c";
  } else if (depth > 50) {
    color = "#ee9c00";
  } else if (depth > 30) {
    color = "#eecc00";
  } else if (depth > 10) {
    color = "#d4ee00";
  } else {
    color = "#98ee00";
  }

  return color;
}

// Helper function for radius
function getRadius(mag) {
  return mag * 4;
}

// Make Map
function createMap(time_frame) {
  // Delete Map
  let map_container = d3.select("#map_container");
  map_container.html(""); // empties it
  map_container.append("div").attr("id", "map"); //recreate it


  // Step 1: CREATE THE BASE LAYERS
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  })

  let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  // Get Data
  let queryUrl = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_${time_frame}.geojson`;
  let platesUrl = 'https://raw.githubusercontent.com/fraxen/tectonicplates/refs/heads/master/GeoJSON/PB2002_boundaries.json';

  d3.json(queryUrl).then(function (data) {
    d3.json(platesUrl).then(function (plate_data) {

      // Step 2: CREATE THE DATA/OVERLAY LAYERS
      console.log(data);

      // Loop through earthquakes
      let markers = [];
      let heatArray = [];
      for (let i = 0; i < data.features.length; i++) {
        let row = data.features[i];
        let location = row.geometry.coordinates;
        if (location) {
          let latitude = location[1];
          let longitude = location[0];
          let depth = location[2];
          let mag = row.properties.mag;

          // Create Marker
          let marker = L.circleMarker([latitude, longitude], {
            fillOpacity: 0.75,
            color: "yellow",
            fillColor: chooseColor(depth),
            radius: getRadius(mag)
          }).bindPopup(`<h1>${row.properties.title}</h1><hr><h2>Depth: ${depth}m</h2>`);

          markers.push(marker);

          // Heatmap point
          heatArray.push([latitude, longitude]);
        }

      }

      // Create the Layer GROUPS
      let markerLayer = L.layerGroup(markers);

      // Create Heatmap Layer
      let heatLayer = L.heatLayer(heatArray, {
        radius: 50,
        blur: 15
      });

      // Create Tectonic Plate Layer
      let geoLayer = L.geoJSON(plate_data, {
        // Dynamic Style Object
        style: {
          color: "blue",
          weight: 5
          }
      });

      // Step 3: CREATE THE LAYER CONTROL
      let baseMaps = {
        Street: street,
        Topography: topo
      };

      let overlayMaps = {
        Earthquakes: markerLayer,
        "Tectonic Plates": geoLayer,
        Heatmap: heatLayer
      };


      // Step 4: INITIALIZE THE MAP
      let myMap = L.map("map", {
        center: [40.7, -94.5],
        zoom: 3,
        layers: [street, markerLayer, geoLayer]
      });

      // Step 5: Add the Layer Control, Legend, Annotations as needed
      L.control.layers(baseMaps, overlayMaps).addTo(myMap);

      // Set up the legend.
      let legend = L.control({ position: "bottomright" });
      legend.onAdd = function () {
        let div = L.DomUtil.create("div", "info legend");

        let legendInfo = `<h3>Earthquake <br> Depth</h3>
        <i style="background:#98ee00"></i>-10-10<br>
        <i style="background:#d4ee00"></i>10-30<br>
        <i style="background:#eecc00"></i>30-50<br>
        <i style="background:#ee9c00"></i>50-70<br>
        <i style="background:#ea822c"></i>70-90<br>
        <i style="background:#ea2c2c"></i>90+`;

        div.innerHTML = legendInfo;

        return div;
      };

      // Adding the legend to the map
      legend.addTo(myMap);
    });
  });
}

function init() {
  let time_frame = d3.select("#time_frame").property("value");
  createMap(time_frame);
}

// Event Listener
d3.select("#filter-btn").on("click", function () {
  init();
});

// on page load
init();

