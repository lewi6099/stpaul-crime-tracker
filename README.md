# webdev-rest

### Test PUT request ('/new-incident'): using curl in terminal...
curl -X PUT http://localhost:8000/new-incident -H "Content-Type: application/json" -d '{"case_number": "1234", "code": "99", "incident": "test1", "police_grid": "100", "neighborhood_number": "101", "block": "102", "date": "2014-08-17", "time": "18:24:00"}'
