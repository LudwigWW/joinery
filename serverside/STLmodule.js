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