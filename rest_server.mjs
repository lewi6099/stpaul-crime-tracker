import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

const port = 8000;

let app = express();
app.use(express.json());

/********************************************************************
 ***   DATABASE FUNCTIONS                                         *** 
 ********************************************************************/
// Open SQLite3 database (in read-write mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + path.basename(db_filename));
    }
    else {
        console.log('Now connected to ' + path.basename(db_filename));
    }
});

// Create Promise for SQLite3 database SELECT query 
function dbSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}

// Create Promise for SQLite3 database INSERT or DELETE query
function dbRun(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}

/********************************************************************
 ***   REST REQUEST HANDLERS                                      *** 
 ********************************************************************/
// GET request handler for crime codes
app.get('/codes', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    let query = req.query;
    let sql = 'SELECT * FROM Codes';
    let params = [];

    if(query.hasOwnProperty("cd")) {
        let codes = query.cd;
        let codesArray = codes.split(',').map(String);
        let questionString = '(' + codesArray.map(() => '?').join(', ') + ')';
        if (params.length == 0) {
            sql += " WHERE code IN " + questionString;
        } else {
            sql += " AND code IN " + questionString;
        }
        codesArray.forEach((element) => {
            params.push(element);
        });
    }

    // Request sql statement
    dbSelect(sql, params)
    .then((rows) => {
        //Rename row
        rows.map((item) => {
            item.type = item.incident_type;
            delete item.incident_type;
        })
        // Send finished rows
        res.status(200).type('json').send(rows);
    })
    .catch((error) => {
        res.status(500).type('txt').send(error);
    })
});

// GET request handler for neighborhoods
app.get('/neighborhoods', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    let query = req.query;
    let sql = 'SELECT * FROM Neighborhoods';
    let params = [];

    // Query option: start_date
    if(query.hasOwnProperty("id")) {
        let neighborhood_numbers = query.id;
        let neighborhood_numberArray = neighborhood_numbers.split(',').map(String); // Turns neighborhood id's into an array
        let questionString = '(' + neighborhood_numberArray.map(() => '?').join(', ') + ')';
        if (params.length == 0) {
            sql += " WHERE neighborhood_number IN " + questionString;
        } else {
            sql += " AND neighborhood_number IN " + questionString;
        }
        neighborhood_numberArray.forEach((element) => {
            params.push(element);
        });
    }

    // Request sql statement
    dbSelect(sql, params)
    .then((rows) => {
        //Rename rows
        rows.map((item) => {
            //neighborhood_number => id
            item.id = item.neighborhood_number;
            delete item.neighborhood_number;
            //neighborhood_name => name
            item.name = item.neighborhood_name;
            delete item.neighborhood_name;
        })
        // Send finished rows
        res.status(200).type('json').send(rows);
    })
    .catch((error) => {
        res.status(500).type('txt').send(error);
    })
});

// GET request handler for crime incidents
app.get('/incidents', (req, res) => {
    let query = req.query;
    let sql = 'SELECT * FROM Incidents';
    let params = [];

    // Query option: start_date
    if(query.hasOwnProperty("start_date")){
        let start_date = query.start_date;
        if(params.length == 0){
            sql += " WHERE date_time > ?";
        } else{
            sql += " AND date_time > ?";
        }
        params.push(start_date);
    }
    // Query option: end_date
    if(query.hasOwnProperty("end_date")){
        let end_date = query.end_date;
        if(params.length == 0){
            sql += " WHERE date_time < ?";
        } else{
            sql += " AND date_time < ?";
        }
        params.push(end_date);
    }
    // Query option: code
    if(query.hasOwnProperty("code")){
        let codes = query.code;
        let codeArray = codes.split(',').map(String); // Turns codes into an array
        let questionString = '(' + codeArray.map(() => '?').join(', ') + ')'; // Creates a string with ? to be inserted in the sql query
        if(params.length == 0){
            sql += " WHERE code IN " + questionString;
        } else{
            sql += " AND code IN " + questionString;
        }
        codeArray.forEach((element) => {
            params.push(element);
        });
    }
    // Query option: grid
    if(query.hasOwnProperty("grid")){
        let grids = query.grid;
        let gridArray = grids.split(',').map(String); // Turns grids into an array
        let questionString = '(' + gridArray.map(() => '?').join(', ') + ')'; // Creates a string with ? to be inserted in the sql query
        if(params.length == 0){
            sql += " WHERE police_grid IN " + questionString;
        } else{
            sql += " AND police_grid IN " + questionString;
        }
        gridArray.forEach((element) => {
            params.push(element);
        });
    }
    // Query option: neighborhood
    if(query.hasOwnProperty("neighborhood")){
        let neighborhoods = query.neighborhood;
        let neighborhoodArray = neighborhoods.split(',').map(String); // Turns neighborhoods into an array
        let questionString = '(' + neighborhoodArray.map(() => '?').join(', ') + ')'; // Creates a string with ? to be inserted in the sql query
        if(params.length == 0){
            sql += " WHERE neighborhood_number IN " + questionString;
        } else{
            sql += " AND neighborhood_number IN " + questionString;
        }
        neighborhoodArray.forEach((element) => {
            params.push(element);
        });
    }
    // Query option: limit
    sql += " ORDER BY date_time DESC LIMIT ?";
    if(query.hasOwnProperty("limit")){
        let limit = query.limit;
        params.push(limit);
    } else{
        params.push('1000')
    }

    // Request sql statement
    dbSelect(sql, params)
    .then((rows) => {
        // Split date and time
        rows.map((item) => {
            item.date = item.date_time.split('T')[0];
            item.time = item.date_time.split('T')[1];
            delete item.date_time;
        })
        // Send finished rows
        res.status(200).type('json').send(rows);
    })
    .catch((error) => {
        res.status(500).type('txt').send(error);
    })
});

// PUT request handler for new crime incident
app.put('/new-incident', (req, res) => {
    let case_number, date_time, code, incident, police_grid, neighborhood_number, block;
    let sql = 'INSERT INTO Incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES (?, ?, ?, ?, ?, ?, ?)';

    // Retrieve all uploaded data
    case_number = req.body.case_number;
    code = req.body.code;
    incident = req.body.incident;
    police_grid = req.body.police_grid;
    neighborhood_number = req.body.neighborhood_number;
    block = req.body.block;
    date_time = req.body.date + 'T' + req.body.time; // Combine date and time into one field
    let params = [case_number, date_time, code, incident, police_grid, neighborhood_number, block]; // Set all the parameters

    // Upload all data to database
    dbRun(sql, params)
    .then((rows) => {
        res.status(200).type('txt').send('OK');
    })
    .catch((error) => {
        if(error.errno == 19){
            res.status(500).type('txt').send('Primary key error: case number ' + case_number + ' already exists');
        }
        else{
            console.log(error);
            res.status(500).type('txt').send(error);
        }
        
    })
});

// DELETE request handler for new crime incident
app.delete('/remove-incident/:case_number', (req, res) => {
    let case_number = req.params.case_number;
    let params = [case_number];
    let sql = 'DELETE FROM incidents WHERE case_number = ?'
    let case_existence_check = 'SELECT * FROM incidents WHERE case_number = ?';
    let successful_delete = 'Deleted incident number ' + case_number;
    let does_not_exist = 'Error: Incident number ' + case_number + ' does not exist';

    // Request sql statement to check if incident exists
    dbSelect(case_existence_check, params)
    .then((rows) => {
        if(rows.length === 0) {
            throw does_not_exist;
        }
        else {
            // Delete incident
            dbRun(sql, params)
                .then(() => {
                    res.status(200).type('txt').send(successful_delete);
                })
                .catch((error) => {
                    console.log(error);
                    res.status(500).type('txt').send(error);
                })
        }
    })
    .catch((error) => {
        res.status(500).type('txt').send(error);
    })
});

/********************************************************************
 ***   START SERVER                                               *** 
 ********************************************************************/
// Start server - listen for client connections
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
