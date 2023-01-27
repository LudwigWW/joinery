var http = require('http');
var STL = require('./STLmodule');
const {execSync} = require('child_process');
var url = require('url');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
const jscad = require('@jscad/modeling')
// const express = require("express");
// const app = express();
// const axios = require('axios').create({baseUrl: "127.0.0.1:5501", headers: {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE", "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization"}});


// const cors = require('cors');

// const corsOptions = {
//   exposedHeaders: 'Authorization',
// };

// app.use(cors(corsOptions));

// app.post(5501, (req, res) => {

//     // res.header("Access-Control-Allow-Origin", "*");
//     // res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
//     // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//     console.log("serving");

//     res.writeHead(200, {'Content-Type': 'text/html'});

//     // res.write(scream);
//     // res.write(noCommand);
//     // res.write(data);
//     return res.end("Test");
// 	console.log("Server started at port 2400");
    
// });

// app.post("", async (req, res) => {
// 	try {
// 		const response = await axios.post("posts", {
// 			title: "Foo",
// 			body: "bar",
// 			userID: 1
// 		});
// 		res.status(200).json(response);
// 	} catch (err) {
// 		res.status(500).json({ message: err });
// 	}
// });
// const instance = axios.create({
//     baseURL: '127.0.0.1:5501',
//     timeout: 1000,
//     headers: {'Access-Control-Allow-Origin': '*'}
//   });

//Create an event handler:
var screamEventHandler = function () {
    console.log('I hear a scream!');
};

// axios({
//     method: 'get',
//     url: `127.0.0.1:5501`,
//     withCredentials: false,
//   });

eventEmitter.on('scream', screamEventHandler);

// const io = require('@jscad/io')npm install @jscad/io

// http.createServer(function (req, res) {
//     res.writeHead(200, {'Content-Type': 'text/html'});
//     res.write("The date and time are currently: " + STL.myDateTime());
//     res.end();
// //   var newOut = execSync("jscad -v").toString();
// //   read.end('newOut');
// }).listen(8080);


http.createServer(function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    // res.writeHead(200, {'Content-Type': 'text/plain'});
    console.log("servered");
    // res.writeHead(200, {'Content-Type': 'text/html'});
    // 
    // var txt = q.year + " " + q.month;
    // // res.write(req.url);
    // res.end(txt);
    var scream = "";
    var noCommand = "There was no command";

    // console.log({data:req});
    const { headers, method, url1 } = req;
    // console.log({headers:headers, method:method, url1:url1});

    var urlObj = url.parse(req.url, true);
    var q = urlObj.query
    console.log('q: ', q);
    console.log('q.pathn: ', urlObj.pathname);

    if (urlObj.pathname === "/exportMarkersSTL") {

        console.log('q.data: ', JSON.parse(q.data));
        console.log('dataSent: ', JSON.parse(q.data).array);

        var jcadtext = "const jscad = require('@jscad/modeling') \n const { cylinder } = jscad.primitives \n \n const options = { \n height: 5.1, \n radius: 3.7 \n } \n const main = () => { \n return cylinder({radius: options.radius, height: options.height, segments: 6}) \n } \n module.exports = { main }";

        // const script = fs.readFileSync('data/test.jscad','UTF8')
        // jscad.compile(script,{}).then((input)=>{
        //     const output = jscad.generateOutput('stlb', input)
        // })


        var cmdOut = execSync("jscad ./data/test.jscad -o ./data/test.stl", (error, stdout, stderr) => {
            
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
        });
        console.log('cmdOut: ', cmdOut);

        if (q.command == "saveTXT") {
            fs.appendFile('./data/mynewfile1.txt', 'Hello content!', function (err) {
                if (err) {
                    // throw err;
                    scream = "FILE ERROR";
                }
                    
                console.log('Saved!');
                eventEmitter.emit('scream');
            });
            noCommand = "";
        }
    }
        
    fs.readFile('demofile1.html', function(err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(scream);
        res.write(noCommand);
        res.write(data);
        return res.end();
    });
  }).listen(5501);


