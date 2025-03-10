var http = require('http');
const util = require('util');
var STL = require('./STLmodule');
const {execSync} = require('child_process');
var url = require('url');
var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
const jscad = require('@jscad/modeling');
const cors = require('cors');
const express = require('express');

const debug = false;

const execPromised = util.promisify(require('child_process').exec);
async function execAsync(command, res, callback) {
    try {
        const { stdout, stderr } = await execPromised(command);
        if (stderr) {
            console.log('stderr:', stderr);
            send_error_response(res, stderr);
            // return -1; // failure state
        } else {
            if(debug) console.log('stdout:', stdout);
            callback();
        }
    } catch (e) {
        console.error(e); // should contain code (exit code) and signal (that caused the termination).
        send_error_response(res, e);
        // return -1; // failure state
    }
}

var reqCounter = 0;
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
var screamEventHandler = function (data) {
    console.log('I hear a scream!' + data);
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




const host = 'localhost';

// const requestListener = function (req, res) {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
//     res.setHeader('Access-Control-Allow-Credentials', true); // If needed

//     res.send('cors problem fixed:)');
// };

// const server = http.createServer(requestListener);
// server.listen(port, host, () => {
//     console.log(`Server is running on http://${host}:${port}`);
// });




const app = express();
const port = 5505;

function send_error_response(res, err) {
    res.writeHead(500, {'Content-Type': 'application/json'});

    console.error(err);
    var errorLoad = JSON.stringify(err)
    res.write(errorLoad);
    return res.end();
}

app.use(cors({ origin: true }));
app.post('/exportMarkersSTL.cmd', (req, res) => {
    
    let geometry_data = '';
    req.on('data', function(data) {
        geometry_data += data
    });

    req.on('end', function() {
        // console.log(JSON.parse(data).todo); // 'Buy the milk'
        geometry_data = JSON.parse(geometry_data);
        if(debug) console.log({geometry_data:geometry_data});
        // res.end();
        var jscadText = STL.extrudePolygonJscad(geometry_data);
    
        const jscadPath = '../../fabricfuse-data/jscad/geo'+geometry_data.ID+'.jscad';
        const stlPath = '../../fabricfuse-data/stl/geo'+geometry_data.ID+'.stl';
        const gcodePath = '../../fabricfuse-data/gcode/geo'+geometry_data.ID+'.gcode';
        const configPath = './data/autoexport.ini';
        fs.writeFile(jscadPath, jscadText, function (er) {
            if (er) {
                // throw err;
                console.log(`File writeopen error: ${er}`);
                scream = "FILE ERROR";
                eventEmitter.emit('scream', scream);
                send_error_response(res, er);
            }
            // eventEmitter.emit('scream', [2,3,4]);

            const jscadCmd = "jscad "+jscadPath+" -o "+stlPath;
            const stlCmd = "prusa-slicer-console.exe -g "+stlPath+" --load "+configPath+" --center "+geometry_data.x+","+geometry_data.y+" --output "+gcodePath;

            execAsync(jscadCmd, res, function() {
                execAsync(stlCmd, res, function() {
                    fs.readFile(gcodePath, function(err, data) {
                        if (err) {
                            console.log(`File read error: ${err}`);
                            send_error_response(res, err);
                        } else {
                            try {
                                var lines = data.toString().split('\n');
                                var start_index = lines.indexOf(";=====startF=====;");
                                var end_index = lines.indexOf(";=====end=====;");
                                lines = lines.slice(start_index+2, end_index); // cut off one extra at start (M107)

                                // lines.unshift("\nG91;\n");
                                // lines.push("\nG90;\n");

                                // Remove intro line retractions
                                for (lineIndex in lines) {
                                    if (lines[lineIndex].search("E-1.5") >= 0) {
                                        lines.splice(lineIndex, 1);
                                        break;
                                    }
                                }

                                for (lineIndex in lines) {
                                    if (lines[lineIndex].search("E1.5") >= 0) {
                                        lines.splice(lineIndex, 1);
                                        break;
                                    }
                                }

                                // Transform into G91
                                var concatLines = STL.g91Conversion(lines);
                                concatLines = "G91;\n" + concatLines; // First move is already in G91 style since slicing happened at 0/0


                                // var concatLines = "";
                                // lines.forEach(function (line) { 
                                //     concatLines += line;
                                //     concatLines += "\n";
                                // });

                                res.writeHead(200, {'Content-Type': 'application/json'});
                                var responseGcode = {gcode:concatLines, ID:geometry_data.ID};
                                var jsonGcode = JSON.stringify(responseGcode);
                                res.write(jsonGcode);
                                return res.end();
                            } catch (e) {
                                send_error_response(res, e);
                            }
                            
                        }
                    });
                    // res.end(`{"message": "This is a JSON response after getting there"}`);
                });
            });

            // const jscadOut = execSync("jscad "+jscadPath+" -o "+stlPath, (error, stdout, stderr) => {
            
            //     if (error) {
            //         console.log(`error: ${error.message}`);
            //         return;
            //     }
            //     if (stderr) {
            //         console.log(`stderr: ${stderr}`);
            //         return;
            //     }
            //     console.log(`stdout: ${stdout}`);


            //     const prusaOut = execSync("prusa-slicer-console.exe -g "+stlPath+" --load "+configPath+" --output "+gcodePath, (error, stdout, stderr) => {
            
            //         if (error) {
            //             console.log(`error: ${error.message}`);
            //             return;
            //         }
            //         if (stderr) {
            //             console.log(`stderr: ${stderr}`);
            //             return;
            //         }
            //         // console.log(`stdout: ${stdout}`);
            //     });
            // });
            
            
        });
    })
})

app.listen(port, () => {
  console.log(`FF server listening on port ${port}`)
})










/*
http.createServer(function (req, res) {
    // res.setHeader("Access-Control-Allow-Origin", "*");
    // res.writeHead(200, {'Content-Type': 'text/plain'});
    console.log("servered");
    // res.writeHead(200, {'Content-Type': 'text/html'});
    // 
    // var txt = q.year + " " + q.month;
    // // res.write(req.url);
    // res.end(txt);
    var scream = "";
    var noCommand = "There was no command";

    // if (req.method === 'OPTIONS') {
    //     console.log("tst");
    //     let body = '';
    //     req.on('data', chunk => {
    //         body += chunk.toString(); // convert Buffer to string
    //         console.log({tstbody:body});
    //     });

    //     req.on('end', () => {
    //         console.log(body);
    //         res.end('ok');
    //     });
    // }


    req.on('data', function(data) {
      body += data
      console.log('Partial body: ' + body)
    });
    // let data = '';
    // req.on('data', chunk => {
    //     data += chunk;
    // })
    // req.on('end', () => {
    //     console.log(JSON.parse(data).todo); // 'Buy the milk'
    //     res.end();
    // })

    console.log(req.data);
    // console.log({data:req});
    const { headers, method, url1 } = req;
    // console.log({headers:headers, method:method, url1:url1});
    console.log({req:req});

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


        fs.writeFile('./data/jscad/geometry'+reqCounter, 'Hello content!', function (err) {
            if (err) {
                // throw err;
                scream = "FILE ERROR";
            }
                
            console.log('Saved!');
            eventEmitter.emit('scream');
        });



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
        
    // fs.readFile('demofile1.html', function(err, data) {
    //     res.writeHead(200, {'Content-Type': 'application/json', "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE"});
    //     res.setHeader("Access-Control-Allow-Origin", "*");
    //     res.setHeader("Access-Control-Allow-Origin", "*");
    //     res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    //     res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    //     // res.write(scream);
    //     // res.write(noCommand);
    //     var payload = {ok:"ok"};
    //     JSON.stringify(payload)
    //     res.write(data);
    //     return res.end();
    // });
    return false;
  }).listen(5501);


*/