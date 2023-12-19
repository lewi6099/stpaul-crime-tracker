<script setup>
    import { ref } from 'vue';
</script>

<template>
    <div class="navbar">
        <div class="container">
            <div class="navbar-content">
                <a href="" class="navbar-link">St. Paul Crime Map</a>
                <a href="about.html" class="navbar-link">About The Project</a>          
            </div>
        </div>
    </div>
</template>

<style scoped>
    .navbar-link {
        padding: 10px 20px;
        background-color: #555;
        color: white;
        text-decoration: none; /* Remove the underline from links */
        border-radius: 5px;
        cursor: pointer;
    }
    body {
        margin: 0;
        padding: 0;
    }

    .navbar {
        background-color: #333;
        color: white;
        padding: 10px 0;
    }

    .container {
        width: 80%;
        margin: 0 auto;
    }

    .navbar-content {
        display: flex;
        justify-content: space-around;
    }

    .navbar-link:hover {
        background-color: #777;
    }
</style>
