var express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
var app = express();

//app.use(bodyParser.urlencoded({ extended: false }))
//app.use(bodyParser.json())

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//serve static resources
//app.use(bodyParser.urlencoded({extended: false})); app.use(express.static(path.join(__dirname, '/public')));
app.use("/public", express.static('./public'));

//routes
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.post("/", function(req, res) {
    var body = req.body;
    console.log(body);  
    console.log("w"+body.SOLaddr);
    if(body.SOLaddr != undefined){ //this is how to test if post was a certain object
        console.log("SOL address entered = " + body.SOLaddr); //access the value of the json like this
    }
    

      
    res.send("post recieved");
  });


// Route to Login Page
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
  });

/*
app.post('/submit-data', function (req, res) {
    var name = req.body.firstName + ' ' + req.body.lastName;
    
    res.send(name + ' Submitted Successfully!');
});

app.put('/update-data', function (req, res) {
    res.send('PUT Request');
});

app.delete('/delete-data', function (req, res) {
    res.send('DELETE Request');
});*/

var server = app.listen(5000, function () {
    console.log('Node server is running..');
});