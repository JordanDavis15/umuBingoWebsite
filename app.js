var express = require('express');
var cookieParser = require('cookie-parser');

const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg')
const fs = require('fs')

var app = express();
var loginInfo = Array();
var pool = null; //set pool to null until init

app.use(cookieParser());

fs.readFile(path.join(__dirname, '/dbinfo.txt'), 'utf8' , (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  loginInfo = data.split('\n'); //split data based on new line
  for(i = 0; i < loginInfo.length; i++){
    loginInfo[i] = loginInfo[i].replace('\r', '');   //remove carriage return char if exists
  }
  console.log(loginInfo[0]);
  pool = new Pool({
    user: loginInfo[0],
    host: loginInfo[1],
    database: loginInfo[2],
    password: String(loginInfo[3]),
    port: loginInfo[4],
  });
});

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
    //test database connection
    testDBAccess();
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
        //getCategoriesFromDB();
        //cats = [];
        console.log("test=====>");
        
        //console.log(getCategoriesFromDB().then((value) => console.log(value)));

        //self calling async function to gather data from getCategoriesFromDB async call
        (async () => {
            console.log('requested database data')
            var cats = await getCategoriesFromDB();
            console.log(cats);
            res.send(JSON.stringify(cats));
        })();
        
        //cats = getCategoriesFromDB().then(value => console.log(value));
        //console.log(cats);
        // for(i = 0; i < 6; i++){
        //     cats.push('Category' + i);
        // }
        //res.send(JSON.stringify(cats));
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
    console.log('Node server is running...');
});

async function testDBAccess(){
    // await pool.query('SELECT * from question', (err, res) => {
    //     if(err){
    //         //do something
    //         console.log(err)
    //     }
    //     else{
    //         console.log(res.rows);
    //         //pool.end()
    //     }
    // });
}

// async function getCategoriesFromDB(){
//     cat = null;
//      pool.query('SELECT DISTINCT category from question', (err, res) => {
//         if(err){
//             //do something
//             console.log(err)
//             return err;
//         }
//         else{
//             console.log(res.rows);
//             cat = res.rows;
//             console.log('test2');
//             console.log(cat);
//             return res;
//             //pool.end()
//         }
//     });
//     //return cat;
// }

async function getCategoriesFromDB() {
    var results = await pool.query("SELECT DISTINCT category from question");
    var cats = [];
    for(i = 0; i < results.rows.length; i++){
        cats.push(results.rows[i].category);
    }
    return cats;
  }

