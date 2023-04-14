exports.myDateTime = function () {
    return Date();
  };

exports.extrudePolygonJscad = function (geometry_data) {
  var jscad = "const jscad = require('@jscad/modeling') \n";
  jscad += "const { extrudeLinear, extrudeRectangular, extrudeRotate } = jscad.extrusions \n";
  jscad += "const { union } = jscad.booleans \n";
  jscad += "const { translate } = jscad.transforms \n";
  jscad += "const { cylinder, polygon } = jscad.primitives \n \n";
  jscad += "const options = { \n points: ["
  var first = true;
  for (let point of geometry_data.points) {
    if (first) {
        first = false;
    } else {
        jscad += ",";
    }
    jscad += "["+point[1]+","+point[2]+"]"; // point[0] holds the string to identify the class "point"
  }
  jscad += "],\n height: "+geometry_data.height+" \n} \n";
  jscad += "const poly = polygon({ points: [ ";
  jscad += " ] })\n\n";
  jscad += "function polygon_marker(input_edges, poly_height) {\n";
  jscad += "    let edges = input_edges;\n";
  // jscad += "    let path = new CSG.Polygon2D(edges, /* Polygon is closed */ true );\n\n";
  jscad += "    let poly = polygon({points: edges});\n\n";
  jscad += "    return extrudeLinear( { height : poly_height }, poly );\n}\n\n";
  jscad += "const main = () => { \n    return union(\n";
  jscad += "        polygon_marker(options.points, options.height), \n";
  jscad += "        translate(["+geometry_data.x+", "+geometry_data.y+", -0.002], cylinder({radius: "+geometry_data.max_dist+", height: 0.001, segments: 50}))\n";
  jscad += "    ); \n}\n\n" // cylinder({radius: options.radius, height: options.height, segments: 6}) \n } \n";
  jscad += "module.exports = { main }";
  return jscad;
}

exports.g91Conversion = function (g90code) {
  
  let lines = g90code;//.split('\n');

  let newText = '';
  let [move,g92,g92Warn,error,g91active] = [false,false,false,false,false];
  let [xMiss,yMiss,zMiss,firstLine] = [true,true,true,true];
  var lastCoords = {x:Infinity,y:Infinity,z:Infinity,e:Infinity};
  var lastSeen = {x:Infinity,y:Infinity,z:Infinity,e:Infinity};

  // Generate output text line by line
  lines.forEach(function (line) {
    if (!error) {
      var coords = {x:Infinity,y:Infinity,z:Infinity,e:Infinity}; // Infinity as "unchanged" boolean
      var remainingPartString = '';
      g92 = false; 
      move = false;
      const preCommentLine = line.split(';')[0];
      if (preCommentLine.length > 0) {
        var parts = preCommentLine.split(' ');
        if (parts[0] === 'G0' || parts[0] === 'G1' || parts[0] === 'g0' || parts[0] === 'g1') {
          move = true;
        }
        if (parts[0] === 'G92' || parts[0] === 'g92') {
          g92 = true;
        }
        if (move || g92) {
          parts.shift(); // Skip G-command-part
          if (parts.length > 0) {
            parts.forEach(function (part) {
              if (part[0] === 'X' || part[0] === 'x') {
                coords.x = parseFloat(part.substring(1));
                xMiss = false;
                if (g92) {
                  g92Warn = true;
                }
              }
              else if (part[0] === 'Y' || part[0] === 'y') {
                coords.y = parseFloat(part.substring(1));
                yMiss = false;
                if (g92) {
                  g92Warn = true;
                }
              }
              else if (part[0] === 'Z' || part[0] === 'z') {
                coords.z = parseFloat(part.substring(1));
                zMiss = false;
                if (g92) {
                  g92Warn = true;
                }
              }
              else if (part[0] === 'E' || part[0] === 'e') {
                // Can't calculate the relative positions if no absolute starting position is known --> Skip execution with warning
                if ((xMiss || yMiss || zMiss) && !error && move) {
                  error = true;
                  vscode.window.showInformationMessage('Error: Extrusion found before XYZ-position fully defined!');
                }
                coords.e = parseFloat(part.substring(1));
              }

              // remaining parts that need no handling
              else {
                remainingPartString = remainingPartString + ' ' + part;
              }
            });
          }
        }
      }


      // New line handling for neat first line replacement 
      if (firstLine) {
        firstLine = false;
      }
      else {
        newText += '\n';
      }

      // Calculate and apply new output if required 
      if (move && g91active) {
        var newLine = line.split(';')[0].split(' ')[0];
        
        if (coords.x !== Infinity) { // TODO: Refactor this repetitive mess
          newLine = newLine + ' X' + (coords.x - lastCoords.x).toFixed(3);
          lastCoords.x = coords.x;
        }
        if (coords.y !== Infinity) {
          newLine = newLine + ' Y' + (coords.y - lastCoords.y).toFixed(3);
          lastCoords.y = coords.y;
        }
        if (coords.z !== Infinity) {
          newLine = newLine + ' Z' + (coords.z - lastCoords.z).toFixed(3);
          lastCoords.z = coords.z;
        }
        if (coords.e !== Infinity) {
          newLine = newLine + ' E' + coords.e.toFixed(5);
          lastCoords.e = coords.e;
        }

        // maintain unchanged parts
        newLine += remainingPartString;

        // maintain commented out parts
        const commentPos = line.indexOf(';'); // TODO: Beautify
        if (commentPos > -1) {
          const comment = line.substring(commentPos);
          newLine += comment;
        }

        // add results to output
        newText += newLine;
      }
      else {
        newText += line;
      }

      if (!g91active) {
        if (coords.x !== Infinity) { // TODO: Refactor this repetitive mess
          lastSeen.x = coords.x;
        }
        if (coords.y !== Infinity) {
          lastSeen.y = coords.y;
        }
        if (coords.z !== Infinity) {
          lastSeen.z = coords.z;
        }
        if (coords.e !== Infinity) {
          lastSeen.e = coords.e;
        }
      }

      if (!(xMiss || yMiss || zMiss) && !g91active) {
        g91active = true;
        // lastCoords = lastSeen;
        newText += '\n\nG91; Switching to relative XYZ positioning!\n';
        if (lastCoords.x === Infinity) { // TODO: Refactor this repetitive mess
          lastCoords.x = lastSeen.x;
        }
        if (lastCoords.y === Infinity) {
          lastCoords.y = lastSeen.y;
        }
        if (lastCoords.z === Infinity) {
          lastCoords.z = lastSeen.z;
        }
        if (lastCoords.e === Infinity) {
          lastCoords.e = lastSeen.e;
        }
      }
    }
  });  

  if (g91active) {
    newText += '\n\nG90; Returning to absolute XYZ positioning!\n';
  }

  return newText;
}