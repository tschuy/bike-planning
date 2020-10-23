"use strict";
const osmUrl = "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
  osmAttrib =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors; tiles from <a href="https://www.cyclosm.org/">cyclosm</a>',
  osm = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib });

const map = L.map("map").setView([40.5837, -122.3934], 11).addLayer(osm);
const stateLayer = L.geoJson(null, {
  style: style,
  onEachFeature: onEachFeature,
});

const camp_icon = L.icon({
  iconUrl: 'assets/campground.png',
  iconSize:     [36, 36]
});

const train_icon = L.icon({
  iconUrl: 'assets/train.png',
  iconSize:     [36, 36]
});

function seconds_to_days_hours_mins_secs_str(seconds) {
  var days = Math.floor(seconds / (24 * 60 * 60));
  seconds -= days * (24 * 60 * 60);
  var hours = Math.floor(seconds / (60 * 60));
  seconds -= hours * (60 * 60);
  var minutes = Math.floor(seconds / 60);
  return (0 < days ? days + " days " : "") + hours + "h" + minutes + "m";
}

function style(feature) {
  return {
    weight: 3,
    opacity: 1,
    color: "black",
  };
}

var highlight = {
  color: "blue",
  weight: 5,
  opacity: 1,
};

let distance_total = 0;
let duration_total = 0;

function setup_layer(layer) {
  stateLayer.setStyle(style);
  layer.setStyle(highlight);

  const summary = layer.feature.properties.summary;
  document.getElementById("duration").textContent = seconds_to_days_hours_mins_secs_str(summary.duration);
  document.getElementById("distance").textContent = `${(summary.distance / 1000).toFixed(1)}km - ${(
    summary.distance / 1609
  ).toFixed(1)}mi`;
  console.log(layer.feature.properties.segments);
  let all_steps = [];
  layer.feature.properties.segments.forEach((seg) => {
    all_steps = all_steps.concat(seg.steps);
  });
  const directions = document.getElementById("directions");
  directions.innerHTML = "";
  all_steps.forEach((step) => {
    let li = document.createElement("li");
    li.innerText = step.instruction;
    directions.appendChild(li);
  });
  document.getElementById("segment_name").innerText = days[layer.layer_id].name;
  swap_panes("segment");
}

function onEachFeature(feature, layer) {
  layer.on("click", function () {
    setup_layer(layer);
  });

  distance_total += layer.feature.properties.summary.distance;
  duration_total += layer.feature.properties.summary.duration;
}

function add_layer(data, layer_id) {
  stateLayer.addData(data);
  const layer = stateLayer._layers[Math.max(...Object.keys(stateLayer._layers))];
  layer.layer_id = layer_id;
  console.log(data);
  days[layer_id].layer = layer;
  console.log(days);
  stateLayer.addTo(map);

  const duration = document.getElementById("duration_total");
  duration.textContent = seconds_to_days_hours_mins_secs_str(duration_total);
  const distance = document.getElementById("distance_total");
  distance.textContent = `${(distance_total / 1000).toFixed(1)}km - ${(distance_total / 1609).toFixed(1)}mi`;
}

async function post_json(url, method, body) {
  return fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
    },
    method: "POST",
    body: body,
  });
}

async function get_directions(coordinates, layer_id) {
  const response = await post_json("/directions", "POST", JSON.stringify(coordinates));
  if (response.status !== 200) {
    console.log("fetch failed: " + response.status);
    return;
  }

  const data = await response.json();
  add_layer(data, layer_id);
}

function swap_panes(destination) {
  console.log(document.getElementById("segment_pane").style);
  console.log(document.getElementById("segment_pane").style.display);
  console.log(destination);
  if (document.getElementById("segment_pane").style.display != "block" && destination != "days") {
    document.getElementById("segment_pane").style.display = "block";
    document.getElementById("days_pane").style.display = "none";
  } else if (destination != "segment") {
    console.log("test2");
    document.getElementById("segment_pane").style.display = "none";
    document.getElementById("days_pane").style.display = "block";
  }
}

document.getElementById("to_days_pane").addEventListener("click", swap_panes);

const days = [
  {
    name: "Arrival Day",
    routes: [
      [
        { type: "train", name: "Redding Amtrak", coordinates: [-122.392559, 40.584884] },
        { type: "waypoint", coordinates: [-122.402948, 40.686434] },
        { type: "waypoint", coordinates: [-122.414544, 40.714657] },
        { type: "campground", name: "Oak Bottom Campground", coordinates: [-122.594818, 40.651117] },
      ],
    ],
  },
  {
    name: "Day 1",
    routes: [
      [
        { type: "campground", name: "Oak Bottom Campground", coordinates: [-122.594818, 40.651117] },
        { type: "campground", name: "Sycamore Grove Campground", coordinates: [-122.204095, 40.156093] },
      ],
    ],
  },
];

const days_list = document.getElementById("days_list");
days.forEach((day) => {
  let li = document.createElement("li");
  li.onclick = function () {
    setup_layer(day.layer);
  };
  li.innerText = day.name;
  days_list.appendChild(li);
  let inner_list = document.createElement("ul");
  li.appendChild(inner_list);
  day.routes.flat().forEach((pt) => {
    if (pt.type != "waypoint") {
      li = document.createElement("li");
      li.onclick = function () {
        setup_layer(day.layer);
      };
      if (pt.type === "campground") {
        L.marker([pt.coordinates[1], pt.coordinates[0]], {icon: camp_icon}).addTo(map).bindPopup(pt.name);
        li.innerText = `🏕️ ${pt.name}`;
      } else if (pt.type === "train") {
        L.marker([pt.coordinates[1], pt.coordinates[0]], {icon: train_icon}).addTo(map).bindPopup(pt.name);
        li.innerText = `🚆 ${pt.name}`;
      }
      if (pt.type !== "waypoint") {
      }
      inner_list.appendChild(li);
    }
  });
});

async function add_days(days) {
  for (const day in days) {
    let coordinates = { coordinates: days[day].routes[0].map((pt) => pt.coordinates) };
    console.log(coordinates);
    const contents = await get_directions(coordinates, day);
  }
}

add_days(days);
