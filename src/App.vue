<script setup>
import { reactive, ref, onMounted } from 'vue';
import CrimeRow from './components/CrimeRow.vue';
import NewCrimeForm from './components/NewCrimeForm.vue';
import NavBar from './components/NavBar.vue';

// Initialize crime URL
let crime_url = ref('');
let dialog_err = ref(false);
let valid_url = ref(false);

// Initialize crime markers array
let crimeMarkers = reactive([]);

// Initialize codes and crimes
let neighborhoods;
let incidentType;
let crimes = reactive([]);
let neighborhoodUI = ref();
let showUI = ref(false);
const nCords = [
    [44.942068, -93.020521, 'Conway / Battlecreek / Highwood', 1, 0],
    [44.977413, -93.025156, 'Greater East Side', 2, 0],
    [44.931244, -93.079578, 'West Side', 3, 0],
    [44.956192, -93.060189, 'Dayton\'s Bluff', 4, 0],
    [44.978883, -93.068163, 'Payne / Phalen', 5, 0],
    [44.975766, -93.113887, 'North End', 6, 0],
    [44.959639, -93.121271, 'Thomas / Dale(Frogtown)', 7, 0],
    [44.947700, -93.128505, 'Summit / University', 8, 0],
    [44.930276, -93.119911, 'West Seventh / Fort Road', 9, 0],
    [44.982752, -93.147910, 'Como Park (Como)', 10, 0],
    [44.963631, -93.167548, 'Hamline / Widway', 11, 0],
    [44.973971, -93.197965, 'Saint Anthony Park', 12, 0],
    [44.949043, -93.178261, 'Union Park', 13, 0],
    [44.934848, -93.176736, 'Macalester / Groveland', 14, 0],
    [44.913106, -93.170779, 'Highland', 15, 0],
    [44.937705, -93.136997, 'Summit Hill', 16, 0],
    [44.949203, -93.093739, 'Downtown (Capitol River)', 17, 0],
]; // lat, lng, name, id, number of crimes

// Initialize configurations and map
let zoom = ref(12);
let locationLat = ref(44.955139);
let locationLng = ref(-93.102222);
let map = reactive(
    {
        leaflet: null,
        center: {
            lat: locationLat.value,
            lng: locationLng.value,
            address: ''
        },
        zoom: zoom.value,
        bounds: {
            nw: {lat: 45.008206, lng: -93.217977},
            se: {lat: 44.883658, lng: -92.993787}
        },
      //These are icons that show up on the map
        neighborhood_markers: [
            {location: [nCords[0][0],nCords[0][1]], marker: null},
            {location: [nCords[1][0],nCords[1][1]], marker: null},
            {location: [nCords[2][0],nCords[2][1]], marker: null},
            {location: [nCords[3][0],nCords[3][1]], marker: null},
            {location: [nCords[4][0],nCords[4][1]], marker: null},
            {location: [nCords[5][0],nCords[5][1]], marker: null},
            {location: [nCords[6][0],nCords[6][1]], marker: null},
            {location: [nCords[7][0],nCords[7][1]], marker: null},
            {location: [nCords[8][0],nCords[8][1]], marker: null},
            {location: [nCords[9][0],nCords[9][1]], marker: null},
            {location: [nCords[10][0],nCords[10][1]], marker: null},
            {location: [nCords[11][0],nCords[11][1]], marker: null},
            {location: [nCords[12][0],nCords[12][1]], marker: null},
            {location: [nCords[13][0],nCords[13][1]], marker: null},
            {location: [nCords[14][0],nCords[14][1]], marker: null},
            {location: [nCords[15][0],nCords[15][1]], marker: null},
            {location: [nCords[16][0],nCords[16][1]], marker: null}
        ]
    }
);
// Vue callback for once <template> HTML has been added to web page
onMounted(() => {
    // Create Leaflet map (set bounds and valied zoom levels)
    map.leaflet = L.map('leafletmap').setView([map.center.lat, map.center.lng], map.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 11,
        maxZoom: 18
    }).addTo(map.leaflet);
    map.leaflet.setMaxBounds([[44.883658, -93.217977], [45.008206, -92.993787]]);

    // Get boundaries for St. Paul neighborhoods
    let district_boundary = new L.geoJson();
    district_boundary.addTo(map.leaflet);
    fetch('data/StPaulDistrictCouncil.geojson')
    .then((response) => {
        return response.json();
    })
    .then((result) => {
        result.features.forEach((value) => {
            district_boundary.addData(value);
        });
    })
    .catch((error) => {
        console.log('Error:', error);
    });

    // Leaflet event listener for when the map moves by panning
    map.leaflet.on("moveend", updateModelCords);
});

// FUNCTIONS
// Function called once user has entered REST API URL
function initializeCrimes() {
    let p1 = fetch(crime_url.value + '/neighborhoods');
    let p2 = fetch(crime_url.value + '/codes');
    Promise.all([p1, p2])
    .then((response) => {
        Promise.all([response[0].json(), response[1].json()])
        .then((newResponse) => {
        neighborhoods = newResponse[0];
        incidentType = newResponse[1];
        })
        .then(() => {
            getIncidents('limit=1000');
            neighborhoodUI.value = false;
        })
    })
    .catch((error) => {
        console.log(error);
    })
}

// Function called when user presses 'OK' on dialog box
function closeDialog() {
    let dialog = document.getElementById('rest-dialog');
    let url_input = document.getElementById('dialog-url');
    if (crime_url.value !== '' && url_input.checkValidity()) {
        dialog_err.value = false;
        valid_url.value = true;
        dialog.close();
        initializeCrimes();
    }
    else {
        dialog_err.value = true;
    }
}

// Function called when user inputs latitude, longitude, or address and presses 'GO'
function submitCords(){
    function update() {
        setTimeout(function () {
            updateCrimes();
        }, 250);
    }
    const inputLat = document.getElementById('input-lat').value;
    const inputLng = document.getElementById('input-lng').value;
    const inputAddress = document.getElementById('input-address').value;
    const center = map.leaflet.getCenter();

    // Address input
    if(inputAddress){
        let apiURL1 = "https://nominatim.openstreetmap.org/search?q=";
        let apiURL2 = "&format=json&limit=1";
        fetch(apiURL1 + inputAddress + apiURL2)
        .then((response) => {
            return response.json();
        })
        .then((newResponse) => {
            if(newResponse[0] == undefined){
                alert("Location not found: Please enter a valid location or address")
            }
            let responseLat = newResponse[0].lat;
            let responseLng = newResponse[0].lon;
            if(checkBounds(responseLat, responseLng)){
                locationLat.value = responseLat;
                locationLng.value = responseLng;
                map.leaflet.setView([locationLat.value, locationLng.value], 13.5);
                update();
            } else{
                alert("Cordinates specified are not in bounds");
            }
        })
    }
    // Lat/lng input
    else if(center.lat != inputLat || center.lng != inputLng){
        if(checkBounds(inputLat, inputLng)){
            map.leaflet.setView([inputLat, inputLng], 13.5);
            update();
        } else {
            alert("Cordinates specified are not in bounds");
        }
    }
    // Update map if there is no movement
    else {
        update();
    }
}

// Function checks which neighborhoods are in view and calls getIncidents()
function updateCrimes(){
    //Check all incident form inputs
    let params = '';
    //If Max Incidents are defined
    const max_incidents = document.getElementById('max_incidents').value;
    if (max_incidents !== '') {
      params += 'limit=' + max_incidents;
    }
    //Default is 1000 incidents
    else {
      params += 'limit=1000';
    }
    //Check if any restrictions on neighborhoods
    let no_selected_neighborhoods = true;
    neighborhoodUI.value = false;
    let selected_neighborhoods = [];
    const neighborhood_checkbox_array = [];
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_Conway').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_GreaterEastSide').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_WestSide').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_DaytonsBluff').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_Payne').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_NorthEnd').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_Thomas').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_Summit').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_WestSeventh').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_Como').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_Hamline').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_SaintAnthonyPark').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_UnionPark').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_Macalester').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_Highland').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_SummitHill').checked);
    neighborhood_checkbox_array.push(document.getElementById('neighborhood_Downtown').checked);
    for(let i=0; i < neighborhood_checkbox_array.length; i++) {
      if(neighborhood_checkbox_array[i] === true) {
        no_selected_neighborhoods = false;
        neighborhoodUI.value = true;
        selected_neighborhoods.push(i+1);
      }
    }
    //If no neighborhoods are selected, get neighborhood markers that are within view
    let newNeighborhoods = [];
    if(no_selected_neighborhoods === true) {
      nCords.forEach((neighborhood) => {
        let lat = neighborhood[0];
        let lng = neighborhood[1];
        if (checkViewBounds(lat, lng)) {
          newNeighborhoods.push(neighborhood[3]);
        }
      })
    }
    //Else select the ones that are checked
    else {
      nCords.forEach((neighborhood) => {
        let num = neighborhood[3];
        if (selected_neighborhoods.includes(num)) {
          newNeighborhoods.push(neighborhood[3]);
        }
      })
    }
    let resultString = newNeighborhoods.join(',');
    params += '&neighborhood=' + resultString;
    //If Date Range is defined
    const start_date = document.getElementById('start_date').value;
    const end_date = document.getElementById('end_date').value;
    if (start_date !== '' && end_date !== '') {
        params += "&start_date=" + start_date + "&end_date=" + end_date;
    }
    //Crime Type Checkboxes
    const incident_type_array = [];
    let first_crime_type = true;
    incident_type_array.push(document.getElementById('type_assault').checked);
    incident_type_array.push(document.getElementById('type_theft').checked);
    incident_type_array.push(document.getElementById('type_damage').checked);
    incident_type_array.push(document.getElementById('type_narcotics').checked);
    incident_type_array.push(document.getElementById('type_proactive').checked);
    incident_type_array.push(document.getElementById('type_other').checked);
    //Assault
    if(incident_type_array[0] === true) {
      if(first_crime_type === true) {
        params += "&code=";
        first_crime_type = false;
      }
      else {
        params += ",";
      }
      for(let i=400; i <= 460; i++) {
        params += i + ",";
      }
      for(let i=861; i < 870; i++) {
        params += i + ",";
      }
      params += '870';
    }
    //Theft
    if(incident_type_array[1] === true) {
      if(first_crime_type === true) {
        params += "&code=";
        first_crime_type = false;
      }
      else {
        params += ",";
      }
      for (let i = 0; i <= 400; i++) {
        params += i + ",";
      }
      for (let i = 461; i <= 860; i++) {
        params += i + ",";
      }
      params += '860';
    }
    //Criminal Damage
    if(incident_type_array[2] === true) {
      if(first_crime_type === true) {
        params += "&code=";
        first_crime_type = false;
      }
      else {
        params += ",";
      }
      for(let i=1400; i < 1430; i++) {
        params += i + ",";
      }
      params += '1430';
    }
    //Narcotics
    if(incident_type_array[3] === true) {
      if(first_crime_type === true) {
        params += "&code=";
        first_crime_type = false;
      }
      else {
        params += ",";
      }
      for(let i=1800; i < 1885; i++) {
        params += i + ",";
      }
      params += '1885';
    }
    //Proactive Police Visit
    if(incident_type_array[4] === true) {
      if(first_crime_type === true) {
        params += "&code=9954";
        first_crime_type = false;
      }
      else {
        params += ",9954";
      }
    }
    //Other
    if(incident_type_array[5] === true) {
      if(first_crime_type === true) {
        params += "&code=2619,9959";
        first_crime_type = false;
      }
      else {
        params += ",2619,9959";
      }
    }
    getIncidents(params);
  }

// Update cords based on panning in model
function updateModelCords() {
    locationLat.value = map.leaflet.getCenter().lat;
    locationLng.value = map.leaflet.getCenter().lng;
    document.getElementById('input-address').value = '';
}

// Check if cords are inbounds
function checkBounds(latCord, lngCord){
    const outerBounds = L.latLngBounds(
        L.latLng(45.008206, -93.217977),
        L.latLng(44.883658, -92.993787)
    );
    const coordinates = L.latLng(latCord, lngCord);
    return outerBounds.contains(coordinates);
}

// Check if cords are in viewing zone
function checkViewBounds(latCord, lngCord){
    const mapView = map.leaflet.getBounds();
    const coordinates = L.latLng(latCord, lngCord);
    return mapView.contains(coordinates);
}

// Function to get incidents
function getIncidents(params) {
    fetch(crime_url.value + '/incidents?' + params)
    .then((response) => {
        return response.json();
    })
    .then((newResponse) => {
        updateNeighborhoodMarkers(newResponse);
        crimes.splice(0, crimes.length);
        newResponse.forEach((index) => {
            let neighborhood_name = neighborhoods.find(neighborhood => neighborhood.id === index.neighborhood_number);
            let incident_type = incidentType.find(code => code.code === index.code);
            crimes.push({
                case_number: index.case_number,
                code: index.code,
                incident_type: incident_type.type,
                incident: index.incident,
                police_grid: index.police_grid,
                neighborhood_name: neighborhood_name.name,
                block: index.block,
                date: index.date,
                time: index.time
            })
        })
    })
    .catch((error) => {
        console.log(error);
    })
}

// Function that handles if a crime row is clicked
function handleCrimeClick(data) {
    // Create red icon for crimes
    const newIcon = new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    // Replaces X in the first part of an address
    function replaceX(string) {
        const spaceIndex = string.split(' ');
        spaceIndex[0] = spaceIndex[0].replace(/x/gi, '0');
        return spaceIndex.join(' ');
    }
    
    let address = data.block;
    address = replaceX(address);
    let inputAddress = address + ', St. Paul, MN';
    let apiURL1 = "https://nominatim.openstreetmap.org/search?q=";
    let apiURL2 = "&format=json&limit=1";
    fetch(apiURL1 + inputAddress + apiURL2)
    .then((response) => {
        return response.json();
    })
    .then((newResponse) => {
        if(newResponse[0] == undefined){
            alert("Not enough information available to generate a pin");
            return;
        }
        let responseLat = newResponse[0].lat;
        let responseLng = newResponse[0].lon;
        // Generate HTML object
        let div = document.createElement('containerDiv');
        let deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete Marker';
        deleteButton.style.backgroundColor = 'grey';
        deleteButton.style.color = 'white';
        let date = document.createElement('p');
        date.textContent = 'Date: '+ data.date;
        let time = document.createElement('p');
        time.textContent = 'Time: '+ data.time;
        let incident = document.createElement('p');
        incident.textContent = 'Incident: '+ data.incident;
        div.appendChild(date);
        div.appendChild(time);
        div.appendChild(incident);
        div.appendChild(deleteButton);

        // Function for when the delete button is pressed
        deleteButton.onclick = function() {
            map.leaflet.removeLayer(marker);
            crimeMarkers.forEach((mark) => {
            if(mark._leaflet_id == marker._leaflet_id){
                crimeMarkers.pop(mark);
            }
        })
        }

        // Generate marker
        let marker = L.marker([responseLat, responseLng], {icon: newIcon}).addTo(map.leaflet)
            .bindPopup(div);
        crimeMarkers.push(marker);
    })
}

// Function that handles erasing all added markers
function handleClearMarkers(){
    crimeMarkers.forEach((marker) => {
        map.leaflet.removeLayer(marker);
    });
    crimeMarkers.splice(0, crimes.length);

}

// Function that updates the neighborhood markers depending on the amount of crimes commited
function updateNeighborhoodMarkers(crimes){
    nCords.forEach((neighborhood) => {
        neighborhood[4] = 0;
    })

    crimes.forEach((crime) => {
        nCords[crime.neighborhood_number - 1][4] = nCords[crime.neighborhood_number - 1][4] + 1;

    })

    //Create green icon
    const greenIcon = new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
        });

    //Add markers to the neighborhoods
    for (let i = 0; i < map.neighborhood_markers.length; i++) {
        L.marker([map.neighborhood_markers[i].location[0], map.neighborhood_markers[i].location[1]], {icon: greenIcon}).addTo(map.leaflet)
            .bindPopup('<b>Neighborhood: </b>' + nCords[i][2] + '<br>' +'<b>Crimes: </b>' + nCords[i][4]);
    }
}
</script>

<template>
    <dialog id="rest-dialog" open>
        <h1 class="dialog-header">St. Paul Crime REST API</h1>
        <label class="dialog-label">URL: </label>
        <input id="dialog-url" class="dialog-input" type="url" v-model="crime_url" placeholder="http://localhost:8000" />
        <p class="dialog-error" v-if="dialog_err">Error: must enter valid URL</p>
        <br/>
        <button class="button" type="button" @click="closeDialog">OK</button>
    </dialog>
    <NavBar></NavBar>
  <div style="padding-top: 20px" class="grid-container">
    <div class="grid-x grid-padding-x">
        <div id="leafletmap" class="cell auto"></div>
    </div>
    <div class="grid-x grid-padding-x">
      <button v-if="crimeMarkers.length>0" id="clear-markers" @click="handleClearMarkers">Clear Markers</button>
    </div>
    <!--User cords or address input box-->
    <div class="user-input">
        <label>Latitude: </label><input id="input-lat" type="text" v-model="locationLat">
        <label>Longitude: </label><input id="input-lng" type="text" v-model="locationLng">
        <label>Address: </label><input id="input-address" type="text" placeholder="Enter valid address">
        <button id="submit-location" type="button" style="background: #099309" @click="submitCords">Go</button>
    </div>
    <!--User filter parameters-->
    <div style="padding-bottom: 10px;">
        <button v-if="showUI" id="UIbutton" type="button" @click="showUI=!showUI">Hide UI</button>
        <button v-if="!showUI" id="UIbutton" type="button" @click="showUI=!showUI">Show UI</button>
    </div>
    <div v-if="showUI" class="grid-container">
        <div class="grid-x grid-padding-x">
            <label style="font-weight: bold;">Incident Type:</label>
        </div>
        <!-- All crime check boxes -->
        <div class="grid-x grid-padding-x">
            <ul>
                <li class="filter_list">
                    <label>Assault: <input id="type_assault" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Theft: <input id="type_theft" type="checkbox"></label>
                </li>
                <li class="filter_list">
                  <label>Criminal Damage: <input id="type_damage" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Narcotics: <input id="type_narcotics" type="checkbox"></label>
                </li>
                <li class="filter_list">
                  <label>Proactive Police Visit: <input id="type_proactive" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Other: <input id="type_other" type="checkbox"></label>
                </li>
            </ul>
        </div>
        <div class="grid-x grid-padding-x">
            <label style="font-weight: bold;">Neighborhood:</label>
        </div>
        <!-- All neighborhood check boxes -->
        <div class="grid-x grid-padding-x">
            <ul>
                <li class="filter_list">
                    <label>Conway/Battlecreek/Highwood: <input id="neighborhood_Conway" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Greater East Side: <input id="neighborhood_GreaterEastSide" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>West Side: <input id="neighborhood_WestSide" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Dayton's Bluff: <input id="neighborhood_DaytonsBluff" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Payne/Phalen: <input id="neighborhood_Payne" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>North End: <input id="neighborhood_NorthEnd" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Thomas/Dale(Frogtown): <input id="neighborhood_Thomas" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Summit/University: <input id="neighborhood_Summit" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>West Seventh/Fort Road: <input id="neighborhood_WestSeventh" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Como Park (Como): <input id="neighborhood_Como" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Hamline/Widway: <input id="neighborhood_Hamline" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Saint Anthony Park: <input id="neighborhood_SaintAnthonyPark" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Union Park: <input id="neighborhood_UnionPark" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Macalester/Groveland: <input id="neighborhood_Macalester" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Highland: <input id="neighborhood_Highland" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Summit Hill: <input id="neighborhood_SummitHill" type="checkbox"></label>
                </li>
                <li class="filter_list">
                    <label>Downtown (Capitol River): <input id="neighborhood_Downtown" type="checkbox"></label>
                </li>
            </ul>
        </div>
        <!-- Calendar for selecting dates -->
        <div class="grid-x grid-padding-x">
          <label style="font-weight: bold;">Show crimes committed between dates:</label>
        </div>
        <div class="grid-x grid-padding-x">
            <form action="/action_page.php">
                <input class="filter_list" type="date" id="start_date">
                <input class="filter_list" type="date" id="end_date">
            </form>
        </div>
        <!-- Number of incidents input box -->
        <div class="grid-x grid-padding-x">
            <label style="font-weight: bold;">Max Incidents: </label>
        </div>
        <div class="grid-x grid-padding-x">
            <input id="max_incidents" type="text" placeholder="Enter max incidents">
        </div>
        <div class="grid-x grid-padding-x">
            <button id="submit-filters" type="button" style="background:#099309; margin:auto; width:50%" @click="updateCrimes">
                Update Crime Filters
            </button>
        </div>
        
    </div>

    <NewCrimeForm v-if="valid_url" :api_url="crime_url"></NewCrimeForm>
    
    <div id="legendArrangement">
        <p style="font-size: large"> Crime Types: </p>
        <p class="legend" style="background-color: lightcoral;"> Violent </p>
        <p class="legend" style="background-color: darkseagreen;"> Property </p>
        <p class="legend" style="background-color: #C4A484;"> Narcotic </p>
        <p class="legend" style="background-color: floralwhite;"> Other </p>
    </div>
    
  </div>
    <div>
        <p v-if="neighborhoodUI" style="float: right; padding: 10px;">*Showing neighborhoods from UI controls</p>
        <p v-if="neighborhoodUI === false" style="float: right; padding: 10px;">*Showing neighborhoods displayed on map</p>
    </div>
    <!-- Crime table -->
    <table v-if="crimes.length > 0">
        <thead>
            <tr>
                <th>Case Number</th>
                <th>Incident Type (Code)</th>
                <th>Incident</th>
                <th>Police Grid</th>
                <th>Neighborhood Name*</th>
                <th>Block</th>
                <th style="min-width: 101px">Date</th>
                <th>Time</th>
                <th></th>
            </tr>
        </thead>
        <tbody v-for="item in crimes">
            <!-- Assault -->
            <CrimeRow v-if="item.code >= 400 && item.code <= 460 || item.code >= 861 && item.code <= 870" @click="handleCrimeClick(item)" id='violent' :data="item" :api_url="crime_url"/>
            <!-- Property Crimes -->
            <CrimeRow v-else-if="item.code <= 860 || item.code >= 1400 && item.code <= 1430" @click="handleCrimeClick(item)" id='property' :data="item" :api_url="crime_url"/>
            <!-- Narcotics -->
            <CrimeRow v-else-if="item.code >= 1800 && item.code <= 1885" @click="handleCrimeClick(item)" id='narcotics' :data="item" :api_url="crime_url"/>
            <!-- Other Crimes -->
            <CrimeRow v-else @click="handleCrimeClick(item)" id='other' :data="item" :api_url="crime_url" />
        </tbody>
    </table>
</template>

<style>
#max_incidents {
    width: 200px;
}
#UIbutton {
        background-color: #ff3a3a;
        color: white;
        padding: 10px;
        font-size: 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
}
#clear-markers {
    background:#ff3a3a;
    color: white;
    padding: 10px;
    font-size: 16px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin: 10px auto auto;
    width:50%;
}
#violent{
  background-color: lightcoral;
}
#property {
  background-color: darkseagreen;
}
#narcotics{
  background-color: #C4A484;
}
#other{
  background-color: floralwhite;
}
#other:hover,
#violent:hover,
#property:hover,
#narcotics:hover {
    background-color: #b4b4b4;
}
#legendArrangement {
  display: flex;
  justify-content: space-evenly;
  width: 50%;
  margin: 10px auto;
  flex-direction: row;
  align-items: center;
}
.legend {
  padding: 10px 20px;
  font-size: large;
}
#rest-dialog {
    width: 20rem;
    margin-top: 1rem;
    z-index: 1000;
}
#leafletmap {
    height: 500px;
}
.dialog-header {
    font-size: 1.2rem;
    font-weight: bold;
}
.dialog-label {
    font-size: 1rem;
}
.dialog-input {
    font-size: 1rem;
    width: 100%;
}
.dialog-error {
    font-size: 1rem;
    color: #D32323;
}

/* User data entry form and crime filter*/
#input-lat,
#input-lng {
    width: 200px;
    margin:10px;
}
#input-address {
    width: 350px;
    margin:10px;
}
.filter_list {
  display: inline-block;
  margin-right: 50px;
  user-select: none;
}
input[type="date"] {
  width: 150px;
  display: inline-block;
}
.user-input {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 10px;
    margin-top: 10px;
}
#submit-location, #submit-filters {
    padding: 8px 15px;
    border-radius: 5px;
    background-color: blue;
    color: white;
    border: none;
    cursor: pointer;
    margin: 10px;
}

</style>
