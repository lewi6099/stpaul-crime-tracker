<script setup>
    defineProps(['data', 'codes', 'neighborhoods']);


</script>

<template>
    <tr>
        <td>{{ data.case_number }}</td>
        <td>{{ data.code }}</td>
        <td>{{ data.incident }}</td>
        <td>{{ data.police_grid }}</td>
        <td>{{ data.neighborhood_name }}</td>
        <td>{{ data.block }}</td>
        <td>{{ data.date }}</td>
        <td>{{ data.time }}</td>
    </tr>
</template>

<style scoped>
    * {
        font-size: 1rem;
    }

    button {
        background-color: #2360A1;
        color: #FFFFFF;
        border: 0;
        box-shadow: none;
        padding: 0.5rem 1rem;
        cursor:pointer;
    }

    button:active {
        background-color: #163E68;
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
