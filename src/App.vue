<script setup>
import { reactive, ref, onMounted } from 'vue';
import CrimeRow from './components/CrimeRow.vue';

// Initialize crime URL
let crime_url = ref('');
let dialog_err = ref(false);

// Initialize codes and crimes
let neighborhoods;
let crimes = reactive([]);

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
        neighborhood_markers: [
            {location: [44.942068, -93.020521], marker: null},
            {location: [44.977413, -93.025156], marker: null},
            {location: [44.931244, -93.079578], marker: null},
            {location: [44.956192, -93.060189], marker: null},
            {location: [44.978883, -93.068163], marker: null},
            {location: [44.975766, -93.113887], marker: null},
            {location: [44.959639, -93.121271], marker: null},
            {location: [44.947700, -93.128505], marker: null},
            {location: [44.930276, -93.119911], marker: null},
            {location: [44.982752, -93.147910], marker: null},
            {location: [44.963631, -93.167548], marker: null},
            {location: [44.973971, -93.197965], marker: null},
            {location: [44.949043, -93.178261], marker: null},
            {location: [44.934848, -93.176736], marker: null},
            {location: [44.913106, -93.170779], marker: null},
            {location: [44.937705, -93.136997], marker: null},
            {location: [44.949203, -93.093739], marker: null}
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
    fetch(crime_url.value + '/neighborhoods')
    .then((response) => {
        return response.json();
    })
    .then((newReponse) => {
        neighborhoods = newReponse;
        console.log(neighborhoods);
    })
    .then(() => {
        getIncidents('limit=100');
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
        dialog.close();
        initializeCrimes();
    }
    else {
        dialog_err.value = true;
    }
}

// Function called when user inputs latitude, longitude, or address and presses 'GO'
function submitCords(){
    const inputLat = document.getElementById('input-lat').value;
    const inputLng = document.getElementById('input-lng').value;
    const inputAddress = document.getElementById('input-address').value;
    // Calculate cordinates and move map from address input
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
            console.log(responseLat);
            if(checkBounds(responseLat, responseLng)){
                locationLat.value = responseLat;
                locationLng.value = responseLng;
                map.leaflet.setView([locationLat.value, locationLng.value], 13.5);
            } else{
                alert("Cordinates specified are not in bounds");
            }
            
        })
    }
    // Move map from lat/lng input
    else {
        if(checkBounds(inputLat, inputLng)){
            map.leaflet.setView([inputLat, inputLng], 13.5);
        } else {
            alert("Cordinates specified are not in bounds");
        }
        
    }
}

// Update cords based on panning in model
function updateModelCords() {
    locationLat.value = map.leaflet.getCenter().lat;
    locationLng.value = map.leaflet.getCenter().lng;
    document.getElementById('input-address').value = '';
}

// Check if cords are inbounds
function checkBounds(latCord, lngCord){
    const mapBounds = map.leaflet.getBounds();
    const coordinates = L.latLng(latCord, lngCord);
    return mapBounds.contains(coordinates);
}

// Function to get incidents
function getIncidents(params) {
    fetch(crime_url.value + '/incidents?' + params)
    .then((response) => {
        return response.json();
    })
    .then((newResponse) => {
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
        console.log(crimes.value);
    })
    .catch((error) => {
        console.log(error);
    })
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
            </tr>
        </thead>
        <tbody>
            <CrimeRow v-for="item in crimes" :data="item"></CrimeRow>
        </tbody>
    </table>
</template>

<style>
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
