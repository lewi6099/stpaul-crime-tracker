# St. Paul Crime Map

The **St. Paul Crime Map** is a web-based application designed to visualize crime data in the city of St. Paul, Minnesota. It provides an interactive map interface to help users explore and understand where crimes have occurred throughout the city.

## Purpose

This application was developed as part of a **Web Development** course to gain hands-on experience using a modern JavaScript framework—**Vue.js**. The goal was to understand the foundational concepts of building single-page applications (SPAs), working with components, managing state, and integrating with APIs.

Additionally, the project served as a collaborative learning experience. It was designed to simulate a real-world development team environment, where students worked together to implement new features, troubleshoot issues, and coordinate code changes. The Crime Map project reflects both technical and teamwork skills developed throughout the course.


## Tech Stack

- **Frontend Framework**: [Vue.js](https://vuejs.org/) (JavaScript)
- **Visual Map Library**: [Leaflet.js](https://leafletjs.com/)
- **Backend Server**: Node.js with [Express.js](https://expressjs.com/) (local REST API)
- **Data Flow**: The Vue frontend makes HTTP requests to a local Express REST API, which provides crime data for display on the map.

## Installation & Setup

### 1. Install Dependencies

In the root project directory, install the required packages:

```bash
npm install
```

### 2. Start the REST API Server

In the terminal, run:

```bash
node rest_server.mjs
```

### 3. Start the Vue Application

Open another terminal window and start the development server:

```bash
npm run dev
```

### 4. Connect the Application to the API

Once the Vue app is running in your browser, you will be prompted to enter the address for the locally running REST API.    
Enter the address in the format:

```
http://localhost:PORT
```
