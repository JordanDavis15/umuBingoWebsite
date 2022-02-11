var express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();
app.use(cookieParser());

//app.use(bodyParser.urlencoded({ extended: false }))
//app.use(bodyParser.json())

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//serve static resources
//app.use(bodyParser.urlencoded({extended: false})); app.use(express.static(path.join(__dirname, '/public')));
app.use('/public', express.static('./public'));


/************************/
/*routes                */
/************************/

//route to login page
app.get('/', function (req, res) {
    //clear all cookies if they exist
    var cookies = req.cookies;
    if(req.cookies != undefined){
        console.log('clearing cookies');
        for (var key of Object.keys(cookies)) {
            console.log("clearing cookie: " + key); // + " -> " + cookies[key])
            res.clearCookie(key);
        }
    }
    //send login page
    res.sendFile(path.join(__dirname, '/login.html'));
});

//route to Login Page (alternate)
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
  });

  //route to Login Page (alternate)
app.get('/index', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

//logic to handle post reqs from category.html
app.post('/category', function(req, res) {
    var selectedOption = req.body.selected;
    if(selectedOption != 'get-categories'){
        console.log('category selected = ' + selectedOption);
        res.cookie('category', selectedOption);
        res.send(JSON.stringify('good'));
    }
    else{
        //insert logic to determine categories here
        //below is sample sending categories
        var cats = []
        for(i = 0; i < 6; i++){
            cats.push('Category' + i);
        }
        res.send(JSON.stringify(cats));
    }

  });

//logic to handle post reqs from index.html and login.html
app.post('/main', function(req, res) {
    var body = req.body;
    console.log(body); 

    if(body.SOLaddr == undefined){
        res.sendFile(path.join(__dirname, '/login.html'));
    }
    
    if(body.SOLaddr != undefined && req.cookies.category == undefined){ //&& req.cookies.category == undefined){                    //check to see if user has selected a category yet
        console.log('SOL address entered = ' + body.SOLaddr); //access the value of the json like this
        res.cookie('userid', body.SOLaddr);                   //sets userid cookie to their SOL Wallet address that was entered
        res.sendFile(path.join(__dirname, '/category.html'));
    }
    else{ //will always want to check for userid cookie value after user has entered their SOL wallet addr
        console.log('=====NEW Logged-in Post Req=====')
        console.log('Current user: ' + req.cookies.userid);

    }
    if(req.cookies.category != undefined){
        console.log('attempting to send index.html');
        
        res.sendFile(path.join(__dirname, '/index.html'));
    }

    if(body[body.length-3] != undefined){ // will get selected value if post req has a selected value
        console.log('user: ' + req.cookies.userid + ' selected: ' + body[body.length-1].selected);

        //insert logic to determine correctness here
        //below is sample setting of correctness
        body.push({'correctness': 'X'}) //'X' denotes correct, ' ' denotes incorrect

        //insert logic to determine bingo achieved here
        //below is sample setting of gameOver
        body.push({'gameOver': ' '}) //'X' denotes over, ' ' denotes bingo not achieved yet

        res.send(JSON.stringify(req.body));
    }


    //res.send('post recieved');
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