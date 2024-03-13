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
const { OctoPrintClient } = require('octoprint-client');
const FormData = require('form-data');
const axios = require('axios');
var request = require('request-promise');
// const { OctoPrintServer } = require('octoprint');
const svelteApp = require('./App.svelte').default;


const debug = false;

// // Initialize OctoPrint client
// const octoPrintClient = new OctoPrintClient({
//     url: 'http://10.42.0.1/op-prusa/', // Replace with your OctoPrint URL
//     apiKey: '754E3BBA98FB4DF98E71C920699D3EDC' // Replace with your OctoPrint API key
// });




// Configuration for OctoPrint server
const octoPrintUrl = 'http://10.42.0.1/op-prusa/';
const apiKey = '754E3BBA98FB4DF98E71C920699D3EDC'; 

// Initialize OctoPrint
// const octoPrint = new OctoPrintServer({ url: octoPrintUrl, apiKey });

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
        // send_error_response(res, e);
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
    console.log('I hear a scream! ' + data);
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

// Example route to get printer status
app.post('/printer/status.cmd', async (req, res) => {

    let test_data = '';
    req.on('data', function(data) {
        test_data += data
    });

    req.on('end', function() {
        test_data = JSON.parse(test_data);

        const testPath = '../../fabricfuse-data/gcode/test.gcode';
        fs.writeFile(testPath, test_data.testGCode, function (er) {
            if (er) {
                console.log(`File writeopen error: ${er}`);
                scream = "FILE ERROR";
                eventEmitter.emit('scream', scream);
            }
            else {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write('{"message": "Gcode saved"}');
                return res.end();
            }
        });

        // Call OctoPrint API to get printer status
        // try {
        //     // Call OctoPrint API to get printer status
        //     const response = await axios.get(`${octoPrintUrl}/api/printer`, {
        //         headers: { 'X-Api-Key': apiKey }
        //     });
        //     console.log(response.data);
        //     res.json(response.data);
        // } catch (error) {
        //     console.error(error);
        //     res.status(500).json({ error: error.message });
        // }
    });

});



// Upload a file
app.post('/print2.cmd', async (req, res) => {
    try {
        // Read the file data
        const filePath = '../../fabricfuse-data/gcode/test.gcode';
        const fileData = fs.readFileSync(filePath);

        console.log({fileData:fileData});

        // Generate a boundary string
        const boundary = `----CoFabricAtionBoundary${Math.random().toString().slice(2)}`;

        // Construct the multipart/form-data body
        let body = `--${boundary}\r\n`;
        body += 'Content-Disposition: form-data; name="file"; filename="test.gcode"\r\n';
        body += 'Content-Type: application/octet-stream\r\n\r\n';
        body += fileData;
        body += `\r\n--${boundary}--\r\n`;

        // Set the headers
        const headers = {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(body),
            'X-Api-Key': apiKey
        };

        // Make the POST request to OctoPrint API
        const response = await axios.post(`${octoPrintUrl}/api/files/local`, body, { headers });

        // Send the response back to the client
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/send.cmd', async (req, res) => {
    try {
        // Set the URL of the OctoPrint instance
        const octoPrintUrl = 'http://10.42.0.1/op-prusa/';

        // Read the file to be sent
        const filePath = '../../fabricfuse-data/gcode/test.gcode';
        const fileName = 'test.gcode'; // Specify the filename
        const fileData = fs.readFileSync(filePath);

        // Construct form data
        const formData = new FormData();
        formData.append('file', fileData, { filename: fileName });
        formData.append('select', 'true');
        formData.append('print', 'true');
        const contentLength = formData.getLengthSync();

        // Send the file to OctoPrint
        const response = await axios.post(`${octoPrintUrl}api/files/local`, formData, {
            headers: {
                // 'Content-Type': 'application/octet-stream',
                ...formData.getHeaders(),
                'Content-Length': contentLength, // Add Content-Length header
                'X-Api-Key': apiKey
            }
        });

        // Log the response from OctoPrint
        console.log(response.data);

        // Send a response back to the client
        res.status(200).json({ message: 'File sent to OctoPrint successfully' });
    } catch (error) {
        // Handle errors
        console.error('Error sending file to OctoPrint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload G-code file and start print job
app.post('/print.cmd', async (req, res) => {

    function restPOSTform(path, form) {
        var self = this;
        return new Promise(function (resolve, reject) {
    
        var url = path;
        // var url = path;
        var options = {
            method: 'POST',
            url: url,
            headers: {
                'X-Api-Key': apiKey
            },
            formData: form,
            json: true // Automatically parses the JSON string in the response
        };
    
        return axios.post(url, form, options)
            .then(function (response) {
                resolve(response.data);
            })
            .catch(function (error) {
                reject(error);
            });
        })
      }

  /**
   * [[Description]]
   * @param   {string} file     The file to upload, including a valid
   * @param   {string} path     The path within the location to upload the file  in (without the future filename - basically the parent folder).
   * @param   {boolean} select   Whether to select the file directly after upload (true) or not (false).
   * @param   {boolean} print    Whether to start printing the file directly after upload (true) or not (false).  If set, select is implicitely true as well.
   * @param   {object} userdata An optional object that if specified will be interpreted as JSON and then saved along with the file as metadata
   * @returns {object} [[Description]]
   */
    function sendFile(file, path, select, print, userdata) {
        var self = this;
        return new Promise(function (resolve, reject) {
        var form = {};
        if (file) {
            if (fs.existsSync(file)) {
                // form.file = fs.createReadStream(file);
                fs.readFileSync('../../fabricfuse-data/gcode/test.gcode');
                // form.file.filename = "test.gcode"; // Add the filename here
            } else {
                reject("No file at path");
            }
        } else {
            reject("No File");
        }
        if (path) {
            form.path = octoPrintUrl + "/api/files/" + path;
            form.filePath = octoPrintUrl + "/api/files/" + path;
            
        }
        if (select) {
            form.select = select;
        }
        if (print) {
            form.print = print;
        }
        if (userdata) {
            form.userdata = JSON.stringify(userdata);
        }
        console.log(form)
        // var api_path = self.getPath("files") + "/local";
        var api_path = `${octoPrintUrl}/api/files/local`;
        restPOSTform(api_path, form).then(function (body, err) {
            resolve(body);
            })
            .catch(function (err) {
            reject(err);
            });
        });
    }

    try {

        // Read G-code file from disk
        const gcodePath = '../../fabricfuse-data/gcode/test.gcode';
        const gcodeData = fs.createReadStream(gcodePath);

        sendFile(gcodePath, "local", true, true, { "name": "test" }).then(function (body) {
            console.log(body);
            res.send('Print job started successfully');
        }).catch(function (err) {
            console.log(err);
            res.status(500).json({ error: err.message });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

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
        // console.log({jscadText:jscadText});
    
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
                            // send_error_response(res, err);
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
                                // send_error_response(res, e);
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

app.get('/control-panel', async (req, res) => {
    // Fetch bucket data
    const buckets = await fetchBucketData();

    // Render the Svelte template
    const { html, css, head } = await renderSvelteTemplate(buckets);

    // Send the rendered HTML as the response
    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                ${head}
                <style>${css.code}</style>
            </head>
            <body>
                <div id="svelteApp">${html}</div>
                <script src="/client.js"></script>
            </body>
        </html>
    `);
});

async function fetchBucketData() {
    // Fetch bucket data from your data source
    // Replace this with your actual implementation
    const buckets = [
        {
            name: 'Bucket 1',
            size: '10GB',
            image: 'bucket1.jpg',
            jobs: [
                {
                    id: 'job1',
                    gcode: 'job1.gcode',
                    previewImage: 'job1-preview.jpg',
                    downloaded: true
                },
                {
                    id: 'job2',
                    gcode: 'job2.gcode',
                    previewImage: 'job2-preview.jpg',
                    downloaded: false
                }
            ]
        },
        {
            name: 'Bucket 2',
            size: '5GB',
            image: 'bucket2.jpg',
            jobs: [
                {
                    id: 'job3',
                    gcode: 'job3.gcode',
                    previewImage: 'job3-preview.jpg',
                    downloaded: true
                },
                {
                    id: 'job4',
                    gcode: 'job4.gcode',
                    previewImage: 'job4-preview.jpg',
                    downloaded: true
                }
            ]
        }
    ];

    return buckets;
}

async function renderSvelteTemplate(buckets) {
    // Import the necessary Svelte components

    // Create a new Svelte app instance
    const svelteApp = new svelteApp({
        target: document.getElementById('svelteApp'),
        props: {
            buckets
        }
    });

    // Render the svelteApp to a string
    const { html, css, head } = svelteApp.render();

    return { html, css, head };
}

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