<script setup>
import { reactive, ref, onMounted } from 'vue';
import CrimeRow from './components/CrimeRow.vue';
import NewCrimeForm from './components/NewCrimeForm.vue';

// Initialize crime URL
let crime_url = ref('');
let dialog_err = ref(false);
let valid_url = ref(false);

// Initialize crime markers array
let crimeMarkers = reactive([]);

// Initialize codes and crimes
let neighborhoods;
let crimes = reactive([]);
const nCords = [
    [44.942068, -93.020521, 'Conway / Battlecreek / Highwood', 1],
    [44.977413, -93.025156, 'Greater East Side', 2],
    [44.931244, -93.079578, 'West Side', 3],
    [44.956192, -93.060189, 'Dayton\'s Bluff', 4],
    [44.978883, -93.068163, 'Payne / Phalen', 5],
    [44.975766, -93.113887, 'North End', 6],
    [44.959639, -93.121271, 'Thomas / Dale(Frogtown)', 7],
    [44.947700, -93.128505, 'Summit / University', 8],
    [44.930276, -93.119911, 'West Seventh / Fort Road', 9],
    [44.982752, -93.147910, 'Como Park (Como)', 10],
    [44.963631, -93.167548, 'Hamline / Widway', 11],
    [44.973971, -93.197965, 'Saint Anthony Park', 12],
    [44.949043, -93.178261, 'Union Park', 13],
    [44.934848, -93.176736, 'Macalester / Groveland', 14],
    [44.913106, -93.170779, 'Highland', 15],
    [44.937705, -93.136997, 'Summit Hill', 16],
    [44.949203, -93.093739, 'Downtown (Capitol River)', 17],
]; // lat, lng, name, id

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

    //Add markers to the neighborhoods
    for (let i=0; i < map.neighborhood_markers.length; ++i ) {
        L.marker([map.neighborhood_markers[i].location[0], map.neighborhood_markers[i].location[1]]).addTo(map.leaflet)
            .bindPopup(nCords[i][2]);
    }

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
    fetch(crime_url.value + '/neighborhoods')
    .then((response) => {
        return response.json();
    })
    .then((newReponse) => {
        neighborhoods = newReponse;
    })
    .then(() => {
        getIncidents('limit=1000');
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

function updateCrimes(){
    let newNeighborhoods = [];
    nCords.forEach((neighborhood) => {
        let lat = neighborhood[0];
        let lng = neighborhood[1];
        if(checkViewBounds(lat, lng)){
            newNeighborhoods.push(neighborhood[3]);
        }
    })
    let params = 'limit=1000&neighborhood=';
    let resultString = newNeighborhoods.join(',');
    params += resultString;
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
        crimes.splice(0, crimes.length);
        newResponse.forEach((index) => {
            let neighborhood_name = neighborhoods.find(neighborhood => neighborhood.id === index.neighborhood_number);
            crimes.push({
                case_number: index.case_number,
                code: index.code,
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
    // Replaces X in the first part of an address
    const newIcon = new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
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
        // Generate marker
        let marker = L.marker([responseLat, responseLng], {icon: newIcon}).addTo(map.leaflet)
            .bindPopup(address);
        crimeMarkers.push(marker);
    })
}

// Function that handles erasing all added markers
function handleClearMarkers(){
    crimeMarkers.forEach((marker) => {
        map.leaflet.removeLayer(marker);
        console.log(marker);
    });
    crimeMarkers.splice(0, crimes.length);

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
    <div class="grid-container ">
        <div class="grid-x grid-padding-x">
            <div id="leafletmap" class="cell auto"></div>
        </div>
        
    <!--User cords or address input box-->
    <div class="user-input">
        <label>Latitude: </label><input id="input-lat" class="space-right" type="text" v-model="locationLat">
        <label>Longitude: </label><input id="input-lng" class="space-right" type="text" v-model="locationLng">
        <label>Address: </label><input id="input-address" class="space-right" type="text" placeholder="Enter valid address">
        <button id="submit-button" type="button" @click="submitCords">Go</button>
    </div>

    <div v-if="crimeMarkers.length > 0">
        <button id="clear-markers" @click="handleClearMarkers">Clear Markers</button>
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

    <!-- Crime table -->
    <table v-if="crimes.length > 0">
        <thead>
            <tr>
                <th>Case Number</th>
                <th>Code</th>
                <th>Incident</th>
                <th>Police Grid</th>
                <th>Neighborhood Name</th>
                <th>Block</th>
                <th>Date</th>
                <th>Time</th>
                <th></th>
            </tr>
        </thead>
        <tbody v-for="item in crimes">
            <!-- Assault -->
            <CrimeRow v-if="item.code >= 400 && item.code <= 460 || item.code >= 861 && item.code <= 870" @click="handleCrimeClick(item)" id='violent' :data="item" :api_url="crime_url"/>
            <!-- Property Crimes -->
            <CrimeRow v-else-if="item.code <= 800 || item.code >= 1400 && item.code <= 1430" @click="handleCrimeClick(item)" id='property' :data="item" :api_url="crime_url"/>
            <!-- Narcotics -->
            <CrimeRow v-else-if="item.code >= 1800 && item.code <= 1885" @click="handleCrimeClick(item)" id='narcotics' :data="item" :api_url="crime_url"/>
            <!-- Other Crimes -->
            <CrimeRow v-else @click="handleCrimeClick(item)" id='other' :data="item" :api_url="crime_url" />
        </tbody>
    </table>
</template>

<style>
#clear-markers {
    background-color: rgb(251, 90, 90);
    color: white;
    padding: 10px;
    font-size: 16px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
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

/* User data entry form*/
#input-lat,
#input-lng {
    width: 200px;
    margin-right: 10px;
    margin:10px;
}

#input-address {
    width: 350px;
    margin-right: 10px;
    margin:10px;
}

.user-input {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 10px;
    margin-top: 10px;
}

#submit-button {
    padding: 8px 15px;
    border-radius: 5px;
    background-color: blue;
    color: white;
    border: none;
    cursor: pointer;
    margin: 10px;
}

</style>
