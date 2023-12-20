<script setup>
    const props = defineProps(['data', 'api_url']);
    import { ref } from 'vue';
    let showRow = ref(true);
    let url = props.api_url + '/remove-incident';

    // Function deletes a case
    function deleteCase() {
        // Set request data
        const requestData = {
            case_number: props.data.case_number
        }
        // Set request options
        const requestOptions = {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        };
        // Send PUT request
        fetch(url, requestOptions)
        .then((response) => {
            if(response.status == 500){ // Check for duplicate case number
                alert("Crime entry unsuccessful: Duplicate case number");
            } else { // Successful entry
                alert("Crime successfully deleted");
                showRow.value = false;
            }
        })
        .catch((error) => {
            console.log(error);
        })
    }
</script>

<template>
        <tr v-if="showRow">
            <td>{{ data.case_number }}</td>
            <td>{{ data.incident_type }} ({{data.code}})</td>
            <td>{{ data.incident }}</td>
            <td>{{ data.police_grid }}</td>
            <td>{{ data.neighborhood_name }}</td>
            <td>{{ data.block }}</td>
            <td>{{ data.date }}</td>
            <td>{{ data.time }}</td>
            <td><button @click="deleteCase">Delete</button></td>
        </tr>
    
</template>

<style scoped>
    * {
        font-size: 1rem;
    }

    button {
        background-color: grey;
        color: #FFFFFF;
        border: 0;
        box-shadow: none;
        padding: 0.5rem 1rem;
        cursor:pointer;
    }

    button:active {
        background-color: rgb(82, 82, 82);
    }

    .ui-row {
        margin: 1rem 0;
    }

    .space-right {
        margin-right: 1rem;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }

    th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }

    th {
        background-color: #f2f2f2;
    }

    tr:hover {
        background-color: #f5f5f5;
    }
</style>
