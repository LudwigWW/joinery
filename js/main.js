// import * as THREE from './js/lib/three.js';

var initialized = false;
var shape = [];
var cursorIcon;
var jointLines;
var flipLines;
var tempLines;
var highlight;
var connectionLines;
var shapeColor = [];
var ctx;
var printingCommands;
const laserColor = '#000';
const laserColorLate = '#F00'
const laserWidth = 0.1;
const laserColorDone = '#933';
const printColor = '#05D';
const printColorDone = '#339';
var noColor;
const debug = false;

function init() {
	if (!initialized) {
		initForms();
	}
	paper.install(window);
	printingCommands = getJSONs("test.json");
	var canvas = document.getElementById('paperCanvas');
	var exportCanvas = document.getElementById('exportCanvas');
	$('#paperCanvas').css({'width':window.innerWidth, 'height':window.innerHeight});
	$('#bgCanvas').attr({'width':window.innerWidth, 'height':window.innerHeight});
	cursorPt = new Point(-1, -1);
	pcursorPt = new Point(-1, -1);
	mousePosition = new Point(-1, -1);
	paper.setup(canvas);
	cursorIcon = new Group();
	jointLines = new Group();
	tempLines = new Group();
	flipLines = new Group();
	highlight = new Group();
	connectionLines = new Group();
	var bgCanvas = document.getElementById('bgCanvas');
	ctx = bgCanvas.getContext('2d');
	paperScale = 1.0;
	drawGrid();
	initialized = true;
	noColor = new Color(0, 0, 0, 0);
	
	// axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

	if(false)
		axios.post('http://127.0.0.1:5501/exportMarkersSTL.cmd', {
			points: [[0,0],[3,0],[3,3]],
			height: 3,
			max_dist: 30,
			x: 125,
			y: 125
		}).then(function (response) {
			console.log(response);
		}).catch(function (error) {
			console.log(error);
		});

	// axios({
	// 	method: 'post',
	// 	headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Access-Control-Allow-Origin':'*' },
	// 	url: 'http://127.0.0.1:5501',
	// 	data: { data : something }
	//   }).then(function (response) {
	// 	console.log(response.data);
	//   });
}

var minorLineCol = "#E8E8E8";
var majorLineCol = "#DADADA";

function getJSONs(jsonName) {
	$.getJSON(jsonName, function(data){
		console.log("🚀 ~ file: main.js:44 ~ $.getJSON ~ data", data)
		return data;
	}).fail(function(){
		console.error("Failed to load JSON template.");
		return;
	});
}

function drawGrid() {
	ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
	if (shape.length>0) {
		var gridSize;
		if (docUnits=='mm') {
			gridSize = Math.round(paperScale * 20);
		} else {
			gridSize = Math.round(paperScale * 25.4);
		}
		var count = 0;
		for (var i=0; i<window.innerWidth; i=i+gridSize) {
			ctx.beginPath();
			ctx.strokeStyle = minorLineCol;
			if (count%5==0 && docUnits=='mm') {
				ctx.strokeStyle = majorLineCol;
			} else if (count%6==0 && docUnits=='in') {
				ctx.strokeStyle = majorLineCol;
			}
			ctx.moveTo(i-0.5, -0.5);
			ctx.lineTo(i-0.5, window.innerHeight+0.5);
			ctx.stroke();
			count++;
		}
		count = 0;
		for (var i=0; i<window.innerHeight; i=i+gridSize) {
			ctx.beginPath();
			ctx.strokeStyle = minorLineCol;
			if (count%5==0 && docUnits=='mm') {
				ctx.strokeStyle = majorLineCol;
			} else if (count%6==0 && docUnits=='in') {
				ctx.strokeStyle = majorLineCol;
			}
			ctx.moveTo(-0.5, i-0.5);
			ctx.lineTo(window.innerWidth+0.5, i-0.5);
			ctx.stroke();
			count++;
		}
	}	
}

var inchToMM = 25.4;
var paperScale = 1.0;
var docUnits = 'mm';
var SVGString = [];
var SVGScale = [];
var SVGprocessed = false;

function checkSVGCount() {
	if (shape.length > 0) {
		$('#exportSVGDiv.inactive').toggleClass('inactive');
		$('#updateSVGDiv.inactive').toggleClass('inactive');
	} else {
		$('#exportSVGDiv:not(.inactive)').toggleClass('inactive');
		$('#updateSVGDiv:not(.inactive)').toggleClass('inactive');
	}
}

function processSVG(e) {
    var file = e.target.result,
        results;
    if (file && file.length) {
		var units = '';
		var w, h;

		var separators = [' ', '\n'];
		var splitString = file.split(new RegExp(separators.join('|'), 'g'));

		for (i in splitString) {
			if (splitString[i].indexOf('=')==5 && splitString[i].indexOf('w')==0) {
				var splitVal = splitString[i].split('=');
				units = splitString[i][splitString[i].length-3]+splitString[i][splitString[i].length-2];
				w = parseFloat(splitVal[1].split(units)[0].split('"')[1]);
			}
			if (splitString[i].indexOf('=')==6 && splitString[i].indexOf('h')==0) {
				var splitVal = splitString[i].split('=');
				units = splitString[i][splitString[i].length-3]+splitString[i][splitString[i].length-2];
				h = parseFloat(splitVal[1].split(units)[0].split('"')[1]);
			}
			if (w && h) {
				break;
			}
		}
		if (units=='mm' || units=='in' || units=='px') {
			if (!SVGprocessed) {
				SVGString.push(file);

				shape.push(paper.project.importSVG(file));
				if (shape[shape.length-1].children.length==1) {
					if (shape[shape.length-1].children[0].className=="Group") {
						shape[shape.length-1].children[0].parent.insertChildren(shape[shape.length-1].children[0].index,  shape[shape.length-1].children[0].removeChildren());
   						for (i in shape[shape.length-1].children) {
   							if (shape[shape.length-1].children[i].className=="Group") {
   								shape[shape.length-1].children[i].remove();
   								break;
   							}
   						}
					}
				}

				SVGprocessed = true;
				shape[shape.length-1].position = new Point(window.innerWidth/2, window.innerHeight/2);
				shape[shape.length-1].name = 'shape';
				shapeColor.push({});
				for (j in shape[shape.length-1].children) {
					if (shape[shape.length-1].children[j].className=='Path') {
						shapeColor[shapeColor.length-1][j] = shape[shape.length-1].children[j].strokeColor;
					}
				}
				if (units=='mm') {
					SVGScale.push(1);
				}
				if (units=='in') {
					shape[shape.length-1].scale(inchToMM, shape[shape.length-1].position);
					SVGScale.push(inchToMM);
				}
				if (units=='px') {
					shape[shape.length-1].scale(inchToMM/72, shape[shape.length-1].position);
					SVGScale.push(inchToMM/72);
					setMessage('SVG units detected as <b>pixels</b>. Using default conversion to millimeters', '#F80');	
				}
				calProjectBounds();
				drawGrid();
				checkSVGCount();
			}
		} else {
			setMessage('<b>SVG units not found</b>. Using default conversion to millimeters', '#F80');
			if (!SVGprocessed) {
				SVGString.push(file);

				shape.push(paper.project.importSVG(file));
				if (shape[shape.length-1].children.length==1) {
					if (shape[shape.length-1].children[0].className=="Group") {
						shape[shape.length-1].children[0].parent.insertChildren(shape[shape.length-1].children[0].index,  shape[shape.length-1].children[0].removeChildren());
   						for (i in shape[shape.length-1].children) {
   							if (shape[shape.length-1].children[i].className=="Group") {
   								shape[shape.length-1].children[i].remove();
   								break;
   							}
   						}
					}
				}

				SVGprocessed = true;
				shape[shape.length-1].position = new Point(window.innerWidth/2, window.innerHeight/2);
				shape[shape.length-1].name = 'shape';
				shapeColor.push({});
				for (j in shape[shape.length-1].children) {
					if (shape[shape.length-1].children[j].className=='Path') {
						shapeColor[shapeColor.length-1][j] = shape[shape.length-1].children[j].strokeColor;
					}
				}
				shape[shape.length-1].scale(inchToMM/72, shape[shape.length-1].position);
				SVGScale.push(inchToMM/72);
				calProjectBounds();
				drawGrid();
				checkSVGCount();
			}
		}
		$('#loadSVG').val('');
    }
	activateDim(dimBool);
	refreshShapeDisplay();
}


var fileSelector = $('<input type="file">');
var shapeToReplace = -1;

function updateSVG() {
	if (shape.length == 1) {
		shapeToReplace = 0;
		fileSelector.click();
	} else if (shape.length > 1) {
		rememberMode = mode;
		mode = 'update';
		$('#updateSVGDiv:not(.active)').toggleClass('active');
		setMessage('<b>select SVG to update</b>', '#444');
	}
}

function updateSVGShape(e) {
	var pathCount = 0;
	for (j in shape[shapeToReplace].children) {
		if (shape[shapeToReplace].children[j].className=='Path' && !isNaN(j)) {
			pathCount++;
		}
	}
	var comparePathCount = 0;
	var file = e.target.result,
        results;
    if (file && file.length) {
    	var units = '';
		var w, h;

		var separators = [' ', '\n'];
		var splitString = file.split(new RegExp(separators.join('|'), 'g'));

		for (i in splitString) {
			if (splitString[i].indexOf('=')==5 && splitString[i].indexOf('w')==0) {
				var splitVal = splitString[i].split('=');
				units = splitString[i][splitString[i].length-3]+splitString[i][splitString[i].length-2];
				w = parseFloat(splitVal[1].split(units)[0].split('"')[1]);
			}
			if (splitString[i].indexOf('=')==6 && splitString[i].indexOf('h')==0) {
				var splitVal = splitString[i].split('=');
				units = splitString[i][splitString[i].length-3]+splitString[i][splitString[i].length-2];
				h = parseFloat(splitVal[1].split(units)[0].split('"')[1]);
			}
			if (w && h) {
				break;
			}
		}
		if (units=='mm' || units=='in' || units=='px') {
			if (!SVGprocessed) {
				SVGString.push(file);

				shape.push(paper.project.importSVG(file));
				if (shape[shape.length-1].children.length==1) {
					if (shape[shape.length-1].children[0].className=="Group") {
						shape[shape.length-1].children[0].parent.insertChildren(shape[shape.length-1].children[0].index,  shape[shape.length-1].children[0].removeChildren());
   						for (i in shape[shape.length-1].children) {
   							if (shape[shape.length-1].children[i].className=="Group") {
   								shape[shape.length-1].children[i].remove();
   								break;
   							}
   						}
					}
				}

				SVGprocessed = true;
				shape[shape.length-1].position = new Point(window.innerWidth/2, window.innerHeight/2);
				shape[shape.length-1].name = 'shape';
				shapeColor.push({});
				for (j in shape[shape.length-1].children) {
					if (shape[shape.length-1].children[j].className=='Path') {
						comparePathCount++;
						shapeColor[shapeColor.length-1][j] = shape[shape.length-1].children[j].strokeColor;
					}
				}
				if (units=='mm') {
					SVGScale.push(1);
				}
				if (units=='in') {
					shape[shape.length-1].scale(inchToMM, shape[shape.length-1].position);
					SVGScale.push(inchToMM);
				}
				if (units=='px') {
					shape[shape.length-1].scale(inchToMM/72, shape[shape.length-1].position);
					SVGScale.push(inchToMM/72);
					setMessage('SVG units detected as <b>pixels</b>. Using default conversion to millimeters', '#F80');	
				}
				calProjectBounds();
				drawGrid();
				checkSVGCount();
			}
		} else {
			setMessage('<b>SVG units not found</b>. Using default conversion to millimeters', '#F80');
			if (!SVGprocessed) {
				SVGString.push(file);

				shape.push(paper.project.importSVG(file));
				if (shape[shape.length-1].children.length==1) {
					if (shape[shape.length-1].children[0].className=="Group") {
						shape[shape.length-1].children[0].parent.insertChildren(shape[shape.length-1].children[0].index,  shape[shape.length-1].children[0].removeChildren());
   						for (i in shape[shape.length-1].children) {
   							if (shape[shape.length-1].children[i].className=="Group") {
   								shape[shape.length-1].children[i].remove();
   								break;
   							}
   						}
					}
				}

				SVGprocessed = true;
				shape[shape.length-1].position = new Point(window.innerWidth/2, window.innerHeight/2);
				shape[shape.length-1].name = 'shape';
				shapeColor.push({});
				for (j in shape[shape.length-1].children) {
					if (shape[shape.length-1].children[j].className=='Path') {
						comparePathCount++;
						shapeColor[shapeColor.length-1][j] = shape[shape.length-1].children[j].strokeColor;
					}
				}
				shape[shape.length-1].scale(inchToMM/72, shape[shape.length-1].position);
				SVGScale.push(inchToMM/72);
				calProjectBounds();
				drawGrid();
			}
		}
		if (pathCount==comparePathCount) {
			for (j in joints) {
				for (k in joints[j]) {
					if (joints[j][k].shape==shapeToReplace) {
						joints[j][k].shape = shape.length-1;
						initJoint(shape.length-1, joints[j][k].path);
					}
				}
			}
			for (j in joints) {
				if (joints[j]['revA']==-1) {
					shape[joints[j][0].shape].children[joints[j][0].path].reverse();
				}
				if (joints[j]['revB']==-1) {
					shape[joints[j][1].shape].children[joints[j][1].path].reverse();
				}
				generateJoint(j);
			}
			generateJointLines();
	    	displayJointLines();
	    	generateEdgeNormals();
	    	displayFlipLines();
			shapeSelected = shapeToReplace;
			removeShape();
			shapeSelected = -1;
		} else {
			setMessage('<b>Different number of paths detected</b>. Unable to update', '#F80');
			shapeSelected = shape.length-1;
			removeShape();
			shapeSelected = -1;
		}
    	fileSelector.val('');
    }
}



function processProject(e) {
    var file = e.target.result,
        results;
    if (file && file.length) {
    	$('#jointListDiv').empty();
		$('#jointProfileListDiv').empty();
		shape = [];
		joints = [];
		jointProfileList = [];
		jointMake = [];
		shapeColor = [];
		SVGString = [];
		SVGScale = [];
		init();
		var JSONfile = JSON.parse(file);
		
		for (var j=0; j<JSONfile.SVGString.length; j++) {
			var units = '';
			var w, h;
			var splitString = JSONfile.SVGString[j].split(' ');
			for (i in splitString) {
				if (splitString[i].indexOf('=')==5 && splitString[i].indexOf('w')==0) {
					var splitVal = splitString[i].split('=');
					units = splitString[i][splitString[i].length-3]+splitString[i][splitString[i].length-2];
					w = parseFloat(splitVal[1].split(units)[0].split('"')[1]);
				}
				if (splitString[i].indexOf('=')==6 && splitString[i].indexOf('h')==0) {
					var splitVal = splitString[i].split('=');
					units = splitString[i][splitString[i].length-3]+splitString[i][splitString[i].length-2];
					h = parseFloat(splitVal[1].split(units)[0].split('"')[1]);
				}
			}
			SVGString.push(JSONfile.SVGString[j]);
			SVGScale.push(JSONfile.SVGScale[j]);
			shape.push(paper.project.importSVG(JSONfile.SVGString[j]));
			if (shape[shape.length-1].children.length==1) {
				if (shape[shape.length-1].children[0].className=="Group") {
					shape[shape.length-1].children[0].parent.insertChildren(shape[shape.length-1].children[0].index,  shape[shape.length-1].children[0].removeChildren());
						for (i in shape[shape.length-1].children) {
							if (shape[shape.length-1].children[i].className=="Group") {
								shape[shape.length-1].children[i].remove();
								break;
							}
						}
				}
			}
			shape[shape.length-1].position = new Point(JSONfile.SVGPos[j][1], JSONfile.SVGPos[j][2]);
			shape[shape.length-1].scale(SVGScale[SVGScale.length-1], shape[shape.length-1].position);
			shape[shape.length-1].name = 'shape';
			shapeColor.push({});
			for (k in shape[shape.length-1].children) {
				if (shape[shape.length-1].children[k].className=='Path') {
					shapeColor[shapeColor.length-1][k] = shape[shape.length-1].children[k].strokeColor;
				}
			}
			calProjectBounds();
			$('#loadSVG').val('');
			activateDim(dimBool);
		}
		
		jointProfileCount = JSONfile.jointProfileCount;
		var jointProfileCountTemp = jointProfileCount - JSONfile.jointProfileList.length;
		for (var i=0; i<JSONfile.jointProfileList.length; i++) {
			var id1 = JSONfile.jointProfileList[i].profile;
			var id1Array = id1.split(' ');
			var id = 'joint_'+id1Array[id1Array.length-1];
			jointProfileList.push(JSONfile.jointProfileList[i]);
			createJointProfileMenu((jointProfileList.length-1), id1Array[id1Array.length-1], id);
			jointProfileCountTemp++;
		}

		for (var i=0; i<JSONfile.joints.length; i++) {
			var jointDetail = JSONfile.joints[i];
			joints.push(JSONfile.joints[i]);
			initJoint(jointDetail[0].shape, jointDetail[0].path);
			initJoint(jointDetail[1].shape, jointDetail[1].path);
			if (jointDetail.revA==-1) {
				shape[jointDetail[0].shape].children[jointDetail[0].path].reverse();
			}
			if (jointDetail.revB==-1) {
				shape[jointDetail[1].shape].children[jointDetail[1].path].reverse();
			}
			generateJoint(joints.length-1);
			jointMake = [];
		}

		refreshJointList();

		for (i in joints) {
			generateJoint[i];
		}
		jointLines.removeChildren();
		refreshShapeDisplay();
    }

    drawGrid();
    checkSVGCount();

    if (mode=='set' || mode=='reverse') {
    	generateJointLines();
    	displayJointLines();
    	generateEdgeNormals();
    	displayFlipLines();
    } else if (mode=='flip') {
    	generateJointLines();
    	displayJointLines();
    	generateEdgeNormals();
    	displayFlipLines();
    }
}

function processJointProfile(e) {
	var file = e.target.result,
    results;
    if (file && file.length) {
    	var JSONfile = JSON.parse(file);
    	var bool = false;
    	for (i in jointType) {
    		if (jointType[i]['name']===JSONfile['name']) {
    			bool = true;

    			JSONfile.profile = JSONfile.name+' '+jointProfileCount;
				jointProfileCount++;
				jointProfileList.push(JSONfile);
				var activeOption = $('#jointTypeDiv .dropdownSelected').find('div')[0].id;
				var activeOptionStr = activeOption.split('_');
				var id = 'joint_'+(jointProfileCount-1);
				createJointProfileMenu((jointProfileList.length-1), jointProfileCount-1, id);
				refreshJointList();

				$('#loadJointProfile').val('');

    			break;
    		}
    	}
    	if (!bool) {
    		setMessage('<b>Joint Profile not found.</b>', '#F80');
    	}
    }
}

var shapeSelected = -1;
var mode = 'set';
function highlightShapeBounds() {
	var bool = false;
	if (insideMenu) {
		cursorIcon.strokeColor = new Color(0, 0);
	} else {
		cursorIcon.strokeColor = '#000';
	}
	for (i in shape) {
		if (shape[i].strokeBounds.contains(cursorPt)) {
			switch (mode) {
				case 'update':
					shape[i].bounds.selected = true;
					shapeSelected = parseInt(i);
					bool = true;
					break;
				case 'arrange':
					if (!moving) {
						shape[i].bounds.selected = true;
						shapeSelected = parseInt(i);
						bool = true;
						$('body').css('cursor', 'move');
					}
					break;
				case 'remove':
					shape[i].strokeColor = '#F00';
					shapeSelected = parseInt(i);
					bool = true;
					break;
			}
		} else {
			$('body').css('cursor', 'default');
			shape[i].bounds.selected = false;
			//shape[i].strokeColor = '#000';
		}
		if (bool) {
			cursorIcon.strokeColor = '#F00';
			break;
		}
	}
	if (!bool && !moving) {
		shapeSelected = -1;
		refreshShapeDisplay();
	}
}

var pathSelected = {'shape':-1, 'path':-1};
var joints = [];
var jointMake = [];
function highlightShapePath() {
	var bool = false;
	if (!$('#contextMenu').hasClass('active')) {
		if (pathSelected.shape != -1 && pathSelected.path != -1) {
			shape[pathSelected.shape].children[pathSelected.path].strokeWidth = 0.5;
			shape[pathSelected.shape].children[pathSelected.path].strokeColor = shapeColor[pathSelected.shape][pathSelected.path];
		}
		for (i in shape) {
			for (j in shape[i].children) {
				if (shape[i].children[j].className=='Path') {
					var pt = shape[i].children[j].getNearestLocation(cursorPt);
					if (pt) {
						var d = pt.getDistance(cursorPt);
						if (d < tolerance/paperScale) {
							if (!bool) {
								shape[i].children[j].strokeWidth = 2.5;
								shape[i].children[j].strokeColor = '#0AF';
								pathSelected.shape = i;
								pathSelected.path = j;
								bool = true;
								if (shape[i].children[j].name=='joint') {
									highlightJointConnections(i, j);
								}
							} else {
								shape[i].children[j].strokeWidth = 0.5;
								if (shapeColor[i][j]) {
									shape[i].children[j].strokeColor = shapeColor[i][j];
								} else {
									shape[i].children[j].strokeColor = "#000";
								}
							}
						} else {
							shape[i].children[j].strokeWidth = 0.5;
							if (shapeColor[i][j]) {
								shape[i].children[j].strokeColor = shapeColor[i][j];
							} else {
								shape[i].children[j].strokeColor = "#000";
							}
						}
						if (bool) {
							break;
						}
					}
				}
			}
			if (bool) {
				break;
			}
		}
		if (!bool) {
			pathSelected = {'shape':-1, 'path':-1};
			if (!insideMenu) {
				clearConnectionLines();
			}
		}
	}
}

function highlightJointConnections(i, j) {
	connectionLines.removeChildren();
	var highlightJointIndex = -1;
	for (index in joints) {
		if ((joints[index]['0'].shape==i && joints[index]['0'].path==j) || (joints[index]['1'].shape==i && joints[index]['1'].path==j)) {
			highlightJointIndex = index;
			break;
		}
	}
	var counter = 0;
	if (highlightJointIndex > -1) {
		var startA = shape[joints[index]['0'].shape].children[joints[index]['0'].path].firstSegment.point;
		var startB = shape[joints[index]['1'].shape].children[joints[index]['1'].path].firstSegment.point;
		var endA = shape[joints[index]['0'].shape].children[joints[index]['0'].path].lastSegment.point;
		var endB = shape[joints[index]['1'].shape].children[joints[index]['1'].path].lastSegment.point;
		var path1 = new Path([startA, startB]);
		var path2 = new Path([endA, endB]);
		connectionLines.addChild(path1);
		connectionLines.children[counter].strokeWidth = 1.0;
		connectionLines.children[counter].strokeColor = '#F86';
		counter++;
		connectionLines.addChild(path2);
		connectionLines.children[counter].strokeWidth = 1.0;
		connectionLines.children[counter].strokeColor = '#F86';
		counter++;
		connectionLines.addChild(shape[joints[index]['0'].shape].children[joints[index]['0'].path+'_joint'].clone());
		connectionLines.children[counter].strokeWidth = 2;
		connectionLines.children[counter].strokeColor = '#0AF';
		counter++;
		connectionLines.addChild(shape[joints[index]['1'].shape].children[joints[index]['1'].path+'_joint'].clone());
		connectionLines.children[counter].strokeWidth = 2;
		connectionLines.children[counter].strokeColor = '#0AF';
		counter++;
	}
}

function clearConnectionLines() {
	connectionLines.removeChildren();
}

function highlightShapePathContext() {
	var bool = false;
	if (pathSelected.shape != -1 && pathSelected.path != -1) {
		shape[pathSelected.shape].children[pathSelected.path].strokeWidth = 0.5;
		if (shapeColor[pathSelected.shape][pathSelected.path]) {
			shape[pathSelected.shape].children[pathSelected.path].strokeColor = shapeColor[pathSelected.shape][pathSelected.path];
		} else {
			shape[pathSelected.shape].children[pathSelected.path].strokeColor = "#000";
		}
	}
	for (i in shape) {
		for (j in shape[i].children) {
			if (shape[i].children[j].className=='Path') {
				var pt = shape[i].children[j].getNearestLocation(cursorPt);
				if (pt) {
					var d = pt.getDistance(cursorPt);
					if (d < tolerance/paperScale) {
						if (!bool) {
							shape[i].children[j].strokeWidth = 2.5;
							shape[i].children[j].strokeColor = '#0AF';
							pathSelected.shape = i;
							pathSelected.path = j;
							bool = true;
						} else {
							shape[i].children[j].strokeWidth = 0.5;
							if (shapeColor[i][j]) {
								shape[i].children[j].strokeColor = shapeColor[i][j];
							} else {
								shape[i].children[j].strokeColor = "#000";
							}
						}
					} else {
						shape[i].children[j].strokeWidth = 0.5;
						if (shapeColor[i][j]) {
							shape[i].children[j].strokeColor = shapeColor[i][j];
						} else {
							shape[i].children[j].strokeColor = "#000";
						}
					}
					if (bool) {
						break;
					}
				}
			}
		}
		if (bool) {
			break;
		}
	}
	if (!bool) {
		pathSelected = {'shape':-1, 'path':-1};
	}
}

function checkPathJoint(s, p) {
	var type = 'noJoint';
	for (i in joints) {
		for (j in joints[i]) {
			if (joints[i][j].shape==s && joints[i][j].path==p) {
				type = {'joint':true, 'index':i, 'edge': j};
			}
		}
	}
	if (type != 'joint' && jointMake.length>0) {
		if (jointMake[0].shape==s && jointMake[0].path==p) {
			type = 'jointMake';
		}
	}
	return type;
}

function singlePathJointButton() {
	// if (pathSelected.shape > -1 && pathSelected.path > -1) {
	if (jointMake.length==1) {
		console.log({checkPathJoint:checkPathJoint(jointMake[0].shape, jointMake[0].path)});
		if (checkPathJoint(jointMake[0].shape, jointMake[0].path)=='jointMake' && mode=='set') {
			var defaultFeatureType = featureTypes[0];
			var jointDetail = {'0':jointMake[0], '1':jointMake[0], 'profile':'none', 'featureType':defaultFeatureType, 'm':0, 'f':1, 'dirM':1, 'dirF':-1, 'revA': 1, 'revB': 1, 'selfJoining': 1};
				joints.push(jointDetail);
				initJoint(jointDetail[0].shape, jointDetail[0].path);
				// initJoint(jointDetail[1].shape, jointDetail[1].path);
				generateJoint(joints.length-1);
				generateJointLines();
				displayJointLines();
				generateEdgeNormals();
				displayFlipLines();
				jointMake = [];
				tempLines.removeChildren();
				setMessage('<b>Joint created</b>', '#444');
				refreshJointList();
		}
	} else {
		setMessage('<b>Joint NOT created</b>', '#444');
		return;
	}
	return;
	if (checkPathJoint(pathSelected.shape, pathSelected.path)=='noJoint' && mode=='set') {
		if (jointMake.length<2) {
			jointMake.push($.extend(true,{},pathSelected));
			tempLines.addChild(shape[pathSelected.shape].children[pathSelected.path].clone());
			tempLines.strokeColor = "#0AF";
			tempLines.strokeWidth = 3;
		}
		if (jointMake.length==2) {
			var delta = shape[jointMake[0].shape].children[jointMake[0].path].length / shape[jointMake[1].shape].children[jointMake[1].path].length;
			if (delta < 1.2 && delta > 0.8) {
				var jointDetail = {'0':jointMake[0], '1':jointMake[1], 'profile':'none', 'm':0, 'f':1, 'dirM':1, 'dirF':-1, 'revA': 1, 'revB': 1};
				joints.push(jointDetail);
				initJoint(jointDetail[0].shape, jointDetail[0].path);
				initJoint(jointDetail[1].shape, jointDetail[1].path);
				generateJoint(joints.length-1);
				generateJointLines();
				displayJointLines();
				generateEdgeNormals();
				displayFlipLines();
				jointMake = [];
				tempLines.removeChildren();
				setMessage('<b>Joint created</b>', '#444');
				refreshJointList();
			} else {
				setMessage('<b>Cannot join</b>: paths have significantly different lengths ' + delta, '#F80');
				jointMake = [];
				tempLines.removeChildren();
			}	
		}
	} else if (checkPathJoint(pathSelected.shape, pathSelected.path).joint) {
		var index = checkPathJoint(pathSelected.shape, pathSelected.path).index;
		var edgeIndex = checkPathJoint(pathSelected.shape, pathSelected.path).edge;
		if (pasteJointProfile.bool) {
			joints[index].profile = jointProfileList[pasteJointProfile.index].profile;
			$('#joint_'+index+'_'+joints[index][0].shape+'-'+joints[index][0].path+'_'+joints[index][1].shape+'-'+joints[index][1].path+' .jointOptions select > option').each(function () {
				if ($(this).val()==joints[index].profile) {
					$(this).prop('selected', true);
				}
			});
			generateJoint(index);
		} else if (mode=='reverse') {
			shape[joints[index][edgeIndex].shape].children[joints[index][edgeIndex].path].reverse();
			if (edgeIndex==0) {
				joints[index].revA = joints[index].revA*-1;
			} else {
				joints[index].revB = joints[index].revB*-1;
			}
			generateJointLines();
			displayJointLines();
			generateEdgeNormals();
			displayFlipLines();	
			generateJoint(index);
			setMessage('<b>Path reversed</b>', '#444');
		} else if (mode=='flip') {
			if (joints[index].m==edgeIndex) {
				joints[index].dirM = joints[index].dirM * -1;
			} else {
				joints[index].dirF = joints[index].dirF * -1;
			}
			generateJoint(index);
			generateJointLines();
			displayJointLines();
			generateEdgeNormals();
			displayFlipLines();	
			setMessage('<b>Joint flipped</b>', '#444');
		} else if (mode=='swap') {
			joints[index].m = (joints[index].m+1)%2;
			joints[index].f = (joints[index].f+1)%2;
			joints[index].dirM = joints[index].dirM*-1;
			joints[index].dirF = joints[index].dirF*-1;
			generateJoint(index);
			generateJointLines();
			displayJointLines();
			generateEdgeNormals();
			displayFlipLines();	
			setMessage('<b>Swapped male and female</b>', '#444');
		}
	} else {
		jointMake = [];
		tempLines.removeChildren();
	}
	// } else {
	// 	jointMake = [];
	// 	tempLines.removeChildren();
	// }

	// if (!checkPathJoint(pathSelected.shape, pathSelected.path).joint && mode!='set' && pathSelected.shape!=-1 && pathSelected.path!=-1) {
	// 	setMessage('<b>Not a joint.</b> please set joints', '#F80');
	// }
}

function shapePathClick() {
	if (pathSelected.shape > -1 && pathSelected.path > -1) {
		if (checkPathJoint(pathSelected.shape, pathSelected.path)=='noJoint' && mode=='set') {
			if (jointMake.length<2) {
				jointMake.push($.extend(true,{},pathSelected));
				tempLines.addChild(shape[pathSelected.shape].children[pathSelected.path].clone());
				tempLines.strokeColor = "#0AF";
				tempLines.strokeWidth = 3;
			}
			if (jointMake.length==2) {
				var delta = shape[jointMake[0].shape].children[jointMake[0].path].length / shape[jointMake[1].shape].children[jointMake[1].path].length;
				if (delta < 1.2 && delta > 0.8) {
					var defaultFeatureType = featureTypes[0];
					var jointDetail = {'0':jointMake[0], '1':jointMake[1], 'profile':'none', 'featureType':defaultFeatureType, 'm':0, 'f':1, 'dirM':1, 'dirF':-1, 'revA': 1, 'revB': 1};
					joints.push(jointDetail);
					initJoint(jointDetail[0].shape, jointDetail[0].path);
					initJoint(jointDetail[1].shape, jointDetail[1].path);
					generateJoint(joints.length-1);
					generateJointLines();
					displayJointLines();
					generateEdgeNormals();
					displayFlipLines();
					jointMake = [];
					tempLines.removeChildren();
					setMessage('<b>Joint created</b>', '#444');
					refreshJointList();
				} else {
					setMessage('<b>Cannot join</b>: paths have significantly different lengths ' + delta, '#F80');
					jointMake = [];
					tempLines.removeChildren();
				}	
			}
		} else if (checkPathJoint(pathSelected.shape, pathSelected.path).joint) {
			var index = checkPathJoint(pathSelected.shape, pathSelected.path).index;
			var edgeIndex = checkPathJoint(pathSelected.shape, pathSelected.path).edge;
			if (pasteJointProfile.bool) {
				joints[index].profile = jointProfileList[pasteJointProfile.index].profile;
				$('#joint_'+index+'_'+joints[index][0].shape+'-'+joints[index][0].path+'_'+joints[index][1].shape+'-'+joints[index][1].path+' .jointOptions select > option').each(function () {
					if ($(this).val()==joints[index].profile) {
						$(this).prop('selected', true);
					}
				});
				generateJoint(index);
			} else if (mode=='reverse') {
				shape[joints[index][edgeIndex].shape].children[joints[index][edgeIndex].path].reverse();
				if (edgeIndex==0) {
					joints[index].revA = joints[index].revA*-1;
				} else {
					joints[index].revB = joints[index].revB*-1;
				}
				generateJointLines();
				displayJointLines();
				generateEdgeNormals();
				displayFlipLines();	
				generateJoint(index);
				setMessage('<b>Path reversed</b>', '#444');
			} else if (mode=='flip') {
				if (joints[index].m==edgeIndex) {
					joints[index].dirM = joints[index].dirM * -1;
				} else {
					joints[index].dirF = joints[index].dirF * -1;
				}
				generateJoint(index);
				generateJointLines();
				displayJointLines();
				generateEdgeNormals();
				displayFlipLines();	
				setMessage('<b>Joint flipped</b>', '#444');
			} else if (mode=='swap') {
				joints[index].m = (joints[index].m+1)%2;
				joints[index].f = (joints[index].f+1)%2;
				joints[index].dirM = joints[index].dirM*-1;
				joints[index].dirF = joints[index].dirF*-1;
				generateJoint(index);
				generateJointLines();
				displayJointLines();
				generateEdgeNormals();
				displayFlipLines();	
				setMessage('<b>Swapped male and female</b>', '#444');
			}
		} else {
			jointMake = [];
			tempLines.removeChildren();
		}
	} else {
		jointMake = [];
		tempLines.removeChildren();
	}

	if (!checkPathJoint(pathSelected.shape, pathSelected.path).joint && mode!='set' && pathSelected.shape!=-1 && pathSelected.path!=-1) {
		setMessage('<b>Not a joint.</b> please set joints', '#F80');
	}
}

function generateJointLines() {
	jointLines.removeChildren();
	var count = 0;
	for (i in joints) {
		var endPt = [];
		for (j in joints[i]) {
			if (j=='0' || j=='1') {
				jointLines.addChild(shape[joints[i][j].shape].children[joints[i][j].path].clone());
				jointLines.children[count].name = 'edge';
				endPt.push(jointLines.children[count].firstSegment.point);
				endPt.push(jointLines.children[count].lastSegment.point);
				count++;
			}
		}
		var path1 = new Path([endPt[0], endPt[2]]);
		var path2 = new Path([endPt[1], endPt[3]]);
		jointLines.addChild(path1);
		jointLines.children[count].name = 'connection';
		count++;
		jointLines.addChild(path2);
		jointLines.children[count].name = 'connection';
		count++;
	}
}

function displayJointLines() { // dashed line showing which two paths are connected by a joint
	for (i in jointLines.children) {
		if (jointLines.children[i].name=='edge') {
			jointLines.children[i].strokeColor = '#0F0';
			jointLines.children[i].strokeWidth = 1.5;
		}
		if (jointLines.children[i].name=='connection') {
			jointLines.children[i].strokeColor = '#999';
			jointLines.children[i].strokeWidth = 0.5;
			jointLines.children[i].dashArray = [1, 1];
		}
	}
}

function generateEdgeNormals() {
	flipLines.removeChildren();
	var count = 0;
	for (i in joints) {
		for (j in joints[i]) {
			if (j=='0' || j=='1') {
				flipLines.addChild(shape[joints[i][j].shape].children[joints[i][j].path].clone());
				flipLines.children[count].name = 'edge';
				var normalVec = flipLines.children[count].getNormalAt(flipLines.children[count].length/2);
				var midPt = flipLines.children[count].getPointAt(flipLines.children[count].length/2);
				count++;
				var dir = joints[i].m==j ? joints[i].dirM : joints[i].dirF;
				var endPt = midPt.add(normalVec.multiply(10*dir));
				flipLines.addChild(new Path.Line(midPt, endPt));
				flipLines.children[count].name = 'normal';
				count++;
			}
		}
	}
}

function displayFlipLines() { // shows the direction of the joint via green normal at mid point of each edge
	for (i in flipLines.children) {
		if (flipLines.children[i].name=='edge') {
			flipLines.children[i].strokeColor = '#0F0';
			flipLines.children[i].strokeWidth = 0;
		}
		if (flipLines.children[i].name=='normal') {
			flipLines.children[i].strokeColor = '#0F0';
			flipLines.children[i].strokeWidth = 1.5;
		}
	}
}

function removeShape() {
	if (shapeSelected > -1 && shape.length > 0) {
		
		for (var i=0; i<joints.length; i++) {
			for (j in joints[i]) {
				if (j=='0' || j=='1') {
					if (joints[i][j].shape == shapeSelected) {
						removeJoint(joints[i][0].shape, joints[i][0].path);
						removeJoint(joints[i][1].shape, joints[i][1].path);
						joints.splice(i, 1);
						i--;
						break;
					}
				}
			}
		}
		shape[shapeSelected].remove();
		shape.splice(shapeSelected, 1);
		shapeColor.splice(shapeSelected, 1);
		SVGString.splice(shapeSelected, 1);
		SVGScale.splice(shapeSelected, 1);
		
		for (var i=0; i<joints.length; i++) {
			for (j in joints[i]) {
				if (j=='0' || j=='1') {
					if (joints[i][j].shape > shapeSelected) {
						joints[i][j].shape--;
					}
				}
			}
		}

		refreshJointList();
		checkSVGCount();
	}
}

// Function goes through all groups in shape
// For all named children 'print', it checks whether pointA and pointB are closer than minDist from any child Path of that group
function checkMinDist(pointA, pointB, minDist) {
	var bool = false;
	for (i in shape) {
		for (j in shape[i].children) {
			if (shape[i].children[j].className=='Group') {
				if (shape[i].children[j].children['print']) {
					var print = shape[i].children[j].children['print'];
					// console.log('print: ', print);
					
					for (k in print.children) {
						if (print.children[k].className=='Path' && print.children[k].name != 'printedMarker') {
							var pt = print.children[k].getNearestLocation(pointA).point;
							if (pointA.getDistance(pt) < minDist) {
								bool = true;
								break;
							}
							pt = print.children[k].getNearestLocation(pointB).point;
							if (pointB.getDistance(pt) < minDist) {
								bool = true;
								break;
							}
						}
					}
				}
			}
		}
	}

	return bool;
}

var projectBounds = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0, 'x':0, 'y':0};
function calProjectBounds() {
	if (shape.length > 0) {
		var corners = [];
		for (i in shape) {
			var rect = shape[i].bounds;
			corners.push({'x':rect.x, 'y':rect.y});
			corners.push({'x':rect.x+rect.width, 'y':rect.y+rect.height});
		}
		corners.sort(function(a, b) {
			return a.x - b.x;
		});
		projectBounds.minX = corners[0].x;
		projectBounds.maxX = corners[corners.length-1].x;
		corners.sort(function(a, b) {
			return a.y - b.y;
		});
		projectBounds.minY = corners[0].y;
		projectBounds.maxY = corners[corners.length-1].y;
		projectBounds.y = (projectBounds.maxY+projectBounds.minY)/2;
		projectBounds.x = (projectBounds.maxX+projectBounds.minX)/2;
	}
}

var tempProjectBounds = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0, 'x':0, 'y':0};
function calTempProjectBounds(inShape) {
	if (inShape.length > 0) {
		var corners = [];
		for (i in inShape) {
			var rect = inShape[i].bounds;
			corners.push({'x':rect.x, 'y':rect.y});
			corners.push({'x':rect.x+rect.width, 'y':rect.y+rect.height});
		}
		corners.sort(function(a, b) {
			return a.x - b.x;
		});
		tempProjectBounds.minX = corners[0].x;
		tempProjectBounds.maxX = corners[corners.length-1].x;
		corners.sort(function(a, b) {
			return a.y - b.y;
		});
		tempProjectBounds.minY = corners[0].y;
		tempProjectBounds.maxY = corners[corners.length-1].y;
		tempProjectBounds.y = (tempProjectBounds.maxY+tempProjectBounds.minY)/2;
		tempProjectBounds.x = (tempProjectBounds.maxX+tempProjectBounds.minX)/2;
	}
}

function checkObjectClass(obj) {
	var s = obj.toString();
	var sArr = s.split(' ');
	return sArr[0];
}

var messageCounter = 0;
function setMessage(s, c) {
	var id = 'message'+messageCounter;
	var html = '<p id="'+id+'">'+s+'</p>'
	$('#topMessage').prepend(html);
	$('#'+id).css('color', c);
	messageCounter++;
	setTimeout(function(){
		$('#'+id).fadeOut(500, function() { $(this).remove(); });
	}, 3500);
}

function refreshShapeDisplay() {
	console.log('refreshShapeDisplay');
	for (i in shape) {
		for (j in shape[i].children) {
			shape[i].children[j].strokeWidth = 0.5;
			shape[i].children[j].strokeCap = 'round';
			if (shapeColor[i][j]) {
				shape[i].children[j].strokeColor = shapeColor[i][j];
			} else {
				shape[i].children[j].strokeColor = '#000';
			}
			if (shape[i].children[j].className=='Path') {
				shape[i].children[j].strokeColor = '#000';
				if (shape[i].children[j].name=='joint') {
					shape[i].children[j].strokeWidth = 0; //0
				} else {
					shape[i].children[j].strokeWidth = 0.5;
				}
			} else if (shape[i].children[j].className=='Group') {
				let elses = true;
				if (shape[i].children[j].children['folds']) {
					elses = false;
					shape[i].children[j].children['folds'].strokeColor = '#AAA';
				} 

				if (shape[i].children[j].children['laser']) {
					elses = false;
					for (laserChild of shape[i].children[j].children.laser.children) {
						if (laserChild.name == 'cut') {
							laserChild.strokeWidth = laserWidth;
							laserChild.strokeColor = laserColor;
						}
						else {
							laserChild.strokeWidth = laserWidth;
							laserChild.strokeColor = '#00F';
						}
					}
				}

				if (shape[i].children[j].children['print']) {
					elses = false;
					shape[i].children[j].children['print'].strokeColor = '#02B';
					shape[i].children[j].children['print'].strokeWidth = 0.1;
					shape[i].children[j].children['print'].fillColor = '#02B';
					shape[i].children[j].children['print'].opacity = 0.25;
					for (printChild of shape[i].children[j].children.print.children) {
						if (printChild.name == 'printedCircle') {
							printChild.strokeWidth = 0;
						}
						else if (printChild.name == 'printedLine') {
							printChild.strokeWidth = printChild.renderWidth;
							printChild.strokeColor = '#02B';
						}
						else if (printChild.name == 'printedText') {
							printChild.strokeWidth = printChild.renderWidth;
							printChild.strokeColor = '#02B';
							printChild.fillColor = new Color(0,0,0,0);
						}
					}
				}
				if (elses) {
					shape[i].children[j].strokeWidth = 0.5;
				}
			}
		}
	}
	paper.view.draw();
}

function grayOutShapes() {
	console.log('grayOutShapes');
	for (i in shape) {
		for (j in shape[i].children) {
			shape[i].children[j].strokeWidth = 0.1;
			shape[i].children[j].strokeCap = 'round';
			if (shape[i].children[j].className=='Group') {
				if (shape[i].children[j].children['print']) {
					shape[i].children[j].children['print'].opacity = 0.25;
					shape[i].children[j].children['print'].strokeWidth = 0.5;
					shape[i].children[j].children['print'].fillColor = '#BBB';
					shape[i].children[j].children['print'].strokeColor = '#999';
				} else if (shape[i].children[j].children['laser']) {
					shape[i].children[j].children['laser'].strokeColor = laserColorDone;

				}
			}
		}

	}
	// paper.view.draw();
}

function colorForLaser(thisShape) {
	console.log("colorForLaser");
	for (j in thisShape.children) {
		if (thisShape.children[j].className=='Group') {
			if (thisShape.children[j].children['laser']) {
				thisShape.children[j].children['laser'].strokeColor = laserColorLate;
				// thisShape.children[j].children['laser'].strokeColor = '#FF0';
				thisShape.children[j].children['laser'].strokeWidth = laserWidth;
			}
			for (child of thisShape.children[j].children) {
				// child.strokeWidth = laserWidth;
			}

			for (laserChild of thisShape.children[j].children.laser.children) {
				if (laserChild.name == 'cut') {
					laserChild.strokeColor = laserColor;
				}
				else {
					laserChild.strokeColor = laserColorLate;
				}
			}
		} else if (thisShape.children[j].className=='Path') {
			thisShape.children[j].strokeWidth = laserWidth;
			thisShape.children[j].strokeColor = laserColorLate;
		}
	}
}


function colorForPreview(thisShape) {
	console.log("colorForLaser");
	for (j in thisShape.children) {
		if (thisShape.children[j].className=='Group') {
			if (thisShape.children[j].children['laser']) {
				thisShape.children[j].children['laser'].strokeColor = laserColor;
				thisShape.children[j].children['laser'].strokeWidth = laserWidth;
			}
			// for (child of thisShape.children[j].children) {
			// 	console.log(child);
			// 	child.strokeWidth = laserWidth;
			// }
		} else if (thisShape.children[j].className=='Path') {
			thisShape.children[j].strokeWidth = laserWidth;
		}
	}
}

var dimBool = false;
function activateDim(bool) {
	for (i in shape) {
		for (var j=0; j<shape[i].children.length; j++) {
			if (shape[i].children[j].className=='PointText') {
				shape[i].children[j].remove();
				j--;
			}
		}
		if (bool) {
			var textW = new PointText(new Point(shape[i].bounds.x+shape[i].bounds.width/2, shape[i].bounds.y-20));
			var textH = new PointText(new Point(shape[i].bounds.x+shape[i].bounds.width+20, shape[i].bounds.y+shape[i].bounds.height/2));
			textW.justification = 'center';
			textW.fillColor = 'black';
			textWStr = docUnits=='mm' ? shape[i].bounds.width : shape[i].bounds.width/inchToMM;
			textW.content = 'w '+textWStr.toFixed(2)+'';
			textH.justification = 'left';
			textH.fillColor = 'black';
			textHStr = docUnits=='mm' ? shape[i].bounds.height : shape[i].bounds.height/inchToMM;
			textH.content = 'h '+textHStr.toFixed(2)+'';
			textH.rotate(90);
			shape[i].addChild(textW);
			shape[i].addChild(textH);
		}
	}
}

function saveProject() {
	var state = {
		'SVGString' : [],
		'SVGScale': [],
		'SVGPos' : [],
		'joints' : [],
		'jointProfileList' : [],
		'jointProfileCount' : jointProfileCount
	};
	for (i in SVGString) {
		state.SVGString.push( SVGString[i] );
		state.SVGScale.push(SVGScale[i]);
		state.SVGPos.push(shape[i].position);
	}
	for (i in joints) {
		state.joints.push( $.extend(true,{},joints[i]) );
	}
	for (i in jointProfileList) {
		state.jointProfileList.push( $.extend(true,{},jointProfileList[i]) );
	}
	var saveText = JSON.stringify(state);
	var blob = new Blob([saveText], {type: "text/plain;charset=utf-8"});
	var d = new Date();
	saveAs(blob, 'joinery_save_'+d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+'_'+d.getHours()+'.'+d.getMinutes()+'.'+d.getSeconds()+'.joinery');
}