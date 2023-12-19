<script setup>
    const props = defineProps(['api_url']);
    import { ref } from 'vue';
    let url = props.api_url + '/new-incident';

    let showForm = ref(false);
    // Inialize variables
    let case_number = ref('');
    let code = ref('');
    let incident = ref('');
    let police_grid = ref('');
    let neighborhood_number = ref('');
    let block = ref('');
    let date = ref('');
    let time = ref('');
    
    // Function to toggle whether the form is shown or not
    function toggleForm(){
        if(showForm.value){
            showForm.value = false;
        } else{
            showForm.value = true;
        }
    }

    function submitNewCrime(){
        // Check for all data filled in
        if(!code.value || !code.value || !incident.value || !police_grid.value || !neighborhood_number.value || !block.value || !date.value || !time.value) {
            alert("Crime entry unsuccessful: Fill all inputs");
            return;
        }

        // Set request data
        const requestData = {
            case_number: case_number.value,
            code: code.value,
            incident: incident.value,
            police_grid: police_grid.value,
            neighborhood_number: neighborhood_number.value,
            block: block.value,
            date: date.value,
            time: time.value
        }
        // Set request options
        const requestOptions = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        };
        // Send PUT request
        fetch(url, requestOptions)
        .then((response) => {
            if(response.status == 500){ // Check for duplicate case number
                alert("Crime entry unsuccessful: Duplicate case number");
            } else { // Successful entry
                case_number.value = '';
                code.value = '';
                incident.value = '';
                police_grid.value = '';
                neighborhood_number.value = '';
                block.value = '';
                date.value = '';
                time.value = '';
                alert("Crime successfully added");
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }
</script>

<template>
    <div v-if="!showForm">
        <button id="showButton" type="button" @click="toggleForm" style="background-color: #ff3a3a">Add a new crime</button>
    </div>
    <div v-if="showForm">
        <button id="hideButton" type="button" @click="toggleForm" style="color: white; background-color: #ff3a3a">
          Hide new crime form
        </button>
    </div>
    <div v-if="showForm">
        <label>Case Number: </label><input type="text" v-model="case_number">
        <label>Code: </label><input type="text" v-model="code">
        <label>Incident: </label><input type="text" v-model="incident">
        <label>Police Grid: </label><input type="text" v-model="police_grid">
        <label>Neighborhood Number: </label><input type="text" v-model="neighborhood_number">
        <label>Block: </label><input type="text" v-model="block">
        <label>Date: </label><input type="text" placeholder="YYYY-MM-DD" v-model="date">
        <label>Time: </label><input type="text" placeholder="HH-MM-SS" v-model="time">

        <button id="submit-button" type="button" @click="submitNewCrime">Submit Crime</button>
    </div>
</template>

<style scoped>
    #showButton {
        background-color: green;
        color: white;
        padding: 10px;
        font-size: 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    #hideButton {
        background-color: grey;
        color: black;
        padding: 10px;
        font-size: 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
</style>
