// import * as STLExports from '../js/lib/STLExport.js';
// console.log('fromMesh: ', STLExports);

var jointProfileCount = 0;
var chosenPrinter = {};
var requestCounter = 0;
var markerGCodes = [];
var printCounter = 799; // Starts at A
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const constXShift = 5;

const defaultLineLength = 10;
const defaultLineGCode = "G91;\nG1 X0.0 E0.8 F2100\nM204 S800\nG1 F900\nG1 X9.600 Y0.000 E2.8504\nG1 F8640\nG1 X-3.291 Y0.000 E-0.76\nG1 X3.291 E-0.04 F2100\nG90\n"; // \nG1 Z0.400 F720

const emptyIDs = true;

function mod(n, m) {
	return ((n % m) + m) % m;
}

var paramInteger = [
	'hook count',
	'skip # holes',
	'printing area width',
	'printing area depth'
];

var paramAngle = [
	'interior angle',
	'flap angle',
	// 'hole spacing',
	// 'hole diameter',
	// 'marker height',
	// 'hem offset'
];

var paramBool = [
	'pinking cut'
];

var loopInsert = {
	'name':'loop insert (overlap)',
	'profile':'',
	'notes': 'notes',
	'param': {
		'material thickness (M)': 0.5,
		'material thickness (F)': 0.5,
		'hem offset': 8,
		'insert width': 8,
		'hook width': 4,
		'hook count': 2,
		'joint spacing': 8,
		'slack': 0,
		'offset start': 0,
		'offset end': 0
	}
};

var loopInsertH = {
	'name':'loop insert',
	'profile':'',
	'notes': 'notes',
	'param': {
		'material thickness (M)': 0.5,
		'material thickness (F)': 0.5,
		'hem offset': 8,
		'insert width': 8,
		'hook width': 4,
		'hook count': 2,
		'joint spacing': 8,
		'slack': 0,
		'offset start': 0,
		'offset end': 0
	}
};

var loopInsertSurface = {
	'name':'loop insert (surface)',
	'profile':'',
	'notes': 'notes',
	'param': {
		'material thickness (M)': 0.5,
		'material thickness (F)': 0.5,
		'hem offset': 8,
		'insert width': 8,
		'hook width': 4,
		'hook count': 4,
		'joint spacing': 8,
		'slack': 0,
		'offset start': 0,
		'offset end': 0
	}
};

var fingerJoint = {
	'name':'finger joint (90deg)',
	'profile':'',
	'notes': 'notes',
	'param': {
		'material thickness (M)': 3,
		'material thickness (F)': 3,
		'finger width': 8,
		'finger radius': 0,
		'offset start': 0,
		'offset end': 0,
		'tolerance': 0
	}
};

var fingerJointA = {
	'name':'finger joint (angle)',
	'profile':'',
	'notes': 'notes',
	'param': {
		'material thickness': 3,
		'finger width': 8,
		'finger radius': 0,
		'interior angle': 90,
		'tolerance': 0
	}
};

var hemJoint = {
	'name':'hem',
	'profile':'',
	'notes': 'notes',
	'param': {
		'hem offset': 8,
		'hole diameter': 0,
		'hole spacing': 10
	}
};

var printedRivets = {
	'name':'printed rivets',
	'profile':'',
	'notes': 'notes',
	'param': {
		'hem offset': 8,
		'hole diameter': 1.5,
		'hole spacing': 10,
		'skip # holes': 0,
		'printing area width': 240,
		'printing area depth': 210,
		'marker height': 3,
		'skip # holes': 0,
		'pinking cut': true,
		'total seam width' : 4.75
	}
};

var printedRunning = {
	'name':'printed running stitch',
	'profile':'',
	'notes': 'notes',
	'param': {
		'hem offset': 8,
		'hole diameter': 1.5,
		'hole spacing': 10,
		'skip # holes': 0,
		'printing area width': 240,
		'printing area depth': 210,
		'marker height': 3,
		'pinking cut': false,
	}
};

var printedBaste = {
	'name':'printed baste stitch',
	'profile':'',
	'notes': 'Seam is easy to break by applying force or breaking printed stitches.',
	'param': {
		'hem offset': 8,
		'hole diameter': 1.5,
		'hole spacing': 20,
		'skip # holes': 0,
		'printing area width': 240,
		'printing area depth': 210,
		'marker height': 3,
		'pinking cut': false,
	}
};

var printedBastePull = {
	'name':'pullable baste stitch',
	'profile':'',
	'notes': 'Seam can be undone just by pulling with a little force.',
	'param': {
		'hem offset': 8,
		'hole diameter': 1.5,
		'hole spacing': 20,
		'skip # holes': 0,
		'printing area width': 240,
		'printing area depth': 210,
		'marker height': 3,
		'pinking cut': false,
	}
};

var printedWhip = {
	'name':'printed whip stitch',
	'profile':'',
	'notes': 'notes',
	'param': {
		'hem offset': 8,
		'pattern width': 5,
		'hole diameter': 1.5,
		'hole spacing': 9,
		'skip # holes': 0,
		'printing area width': 240,
		'printing area depth': 210,
		'marker height': 3,
		'pinking cut': false,
	}
};
var printedZigZag = {
	'name':'printed zig zag stitch',
	'profile':'',
	'notes': 'notes',
	'param': {
		'hem offset': 8,
		'pattern width': 5,
		'hole diameter': 1.5,
		'hole spacing': 9,
		'skip # holes': 0,
		'printing area width': 240,
		'printing area depth': 210,
		'marker height': 3,
		'pinking cut': false,
	}
};
var printedCross = {
	'name':'printed cross stitch',
	'profile':'',
	'notes': 'notes',
	'param': {
		'hem offset': 8,
		'pattern width': 5,
		'hole diameter': 1.5,
		'hole spacing': 7,
		'skip # holes': 0,
		'printing area width': 240,
		'printing area depth': 210,
		'marker height': 3,
		'pinking cut': false,
	}
};
var printedDecorative = {
	'name':'printed decorative stitch',
	'profile':'',
	'notes': 'notes',
	'param': {
		'hem offset': 8,
		'hole diameter': 1.5,
		'hole spacing': 10,
		'skip # holes': 0,
		'printing area width': 240,
		'printing area depth': 210,
		'marker height': 3,
		'pinking cut': false,
	}
};

var tabInsertJoint = {
	'name':'tab insert',
	'profile':'',
	'notes': 'notes',
	'param': {
		'material thickness (M)': 1.0,
		'material thickness (F)': 1.0,
		'insert width': 10,
		'insert height': 8,
		'flap height': 8,
		'flap angle': 60,
		'joint spacing': 30,
		'offset start': 15,
		'offset end': 15,
		'grip': 0.7
	}
};

var interlockingJoint = {
	'name':'interlocking',
	'profile':'',
	'notes': 'notes',
	'param': {
		'material thickness (M)': 1.0,
		'material thickness (F)': 1.0,
		'interlocking width': 15,
		'interlocking height': 8,
		'flap angle': 85,
		'offset start': 0,
		'offset end': 0,
		'grip': 2,
		'tolerance': 0.1
	}
};

var flapJoint = {
	'name':'flap',
	'profile':'',
	'notes': 'notes',
	'param': {
		'height (M)': 10,
		'height (F)': 10,
		'flap angle': 60,
		'hole diameter': 0,
		'hole spacing': 20
	}
};

var noneJoint = {
	'name':'none',
	'profile':'',
	'notes': 'notes',
	'param': {
	}
};

var template = undefined;

var jointType = [printedRivets, printedRunning, printedBaste, printedBastePull, printedWhip, printedZigZag, printedCross, printedDecorative, loopInsert, loopInsertH, loopInsertSurface, hemJoint, interlockingJoint, fingerJoint, fingerJointA, tabInsertJoint, flapJoint, noneJoint];

var jointProfileList = [];

function createJointProfile(n) {
	if (n < jointType.length) {
		var joint1 = $.extend(true,{},jointType[n]);
		joint1.profile = joint1.name+' '+jointProfileCount;
		jointProfileCount++;
		jointProfileList.push(joint1);
	}
}

function initJoint(s, p) {
	console.log("CC ~ file: joints.js:335 ~ initJoint ~ s, p:", s, p);

	var g = new Group();
	g.name = p+'_joint';
	shape[s].addChild(g);
	shape[s].children[p].name = 'joint';
	shape[s].children[p].strokeWidth = 0;
}

function removeJoint(s, p) {
	for (var i=0; i<shape[s].children.length; i++) {
		if (shape[s].children[i].className=='Group' && shape[s].children[i].name!==undefined) {
			var str = shape[s].children[i].name.split('_');
			if (parseInt(str[0])==p) {
				shape[s].children.splice(i, 1);
				i--;
			}
		}
	}
	shape[s].children[p+'_joint'].remove();
	shape[s].children[p].name = '';
	shape[s].children[p].strokeWidth = 1;
	activateDim(dimBool);
}

function generateJoint(index) {
	
	var req = $.getJSON('test.json');

	req.success(function(response){
		// console.log({response:response});
		// console.log("🚀 ~ file: joints.js:216 ~ generateJoint ~ value", response)
		
		for (let printer of response.printerList) {
			if (printer.name === "default") {
				chosenPrinter = printer;
			}
		}
		
		printTemplate = response;
		var shapeA, shapeB, pathA, pathB;

		if (joints[index]['m']==0) {
			shapeA = joints[index]['0'].shape;
			shapeB = joints[index]['1'].shape;
			pathA = joints[index]['0'].path;
			pathB = joints[index]['1'].path;
		} else {
			shapeA = joints[index]['1'].shape;
			shapeB = joints[index]['0'].shape;
			pathA = joints[index]['1'].path;
			pathB = joints[index]['0'].path;
		}
		
		shape[shapeA].children[pathA+'_joint'].removeChildren();
		shape[shapeB].children[pathB+'_joint'].removeChildren();
		
		var jType;
		var param;
		for (i in jointProfileList) {
			if (joints[index].profile==jointProfileList[i].profile) {
				jType = jointProfileList[i].name;
				param = $.extend(true,{},jointProfileList[i].param);
				break;
			}
		}
	
		var delta = shape[shapeA].children[pathA].length / shape[shapeB].children[pathB].length;
		
		if (delta > 1.5 || delta < 0.5) { // 1.01;0.99
			console.log('delta: ', delta);
			setMessage('<b>Cannot join</b>: paths have significantly different lengths ' + delta, '#F80');
		} else {
			switch (jType) {
				case 'loop insert (overlap)':
					var childPath = generateLoopInsert(index, shapeA, pathA, shapeB, pathB, param, true, false, Math.floor(param['hook count']));
					shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					var g = new Group();
					g.name = 'folds';
					shape[shapeB].children[pathB+'_joint'].addChild(g);
					shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);
					shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					break;
					
				case 'loop insert':
					var childPath = generateLoopInsert(index, shapeA, pathA, shapeB, pathB, param, false, false, Math.floor(param['hook count']));
					shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
					shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					break;
	
				case 'loop insert (surface)':
					var childPath = generateLoopInsert(index, shapeA, pathA, shapeB, pathB, param, false, true, Math.floor(param['hook count']));
					if (childPath) {
						shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
						shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
						shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
						shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
						shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
						shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					} else {
						shape[shapeA].children[pathA+'_joint'].addChild(shape[shapeA].children[pathA].clone());
						shape[shapeB].children[pathB+'_joint'].addChild(shape[shapeB].children[pathB].clone());
						shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
						shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					}
					break;
					
				case 'finger joint (90deg)':
					var childPath = generateFingerJoint(index, shapeA, pathA, shapeB, pathB, param);
					if (childPath) {
						shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
						shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
						shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
						shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
						shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
						shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					} else {
						shape[shapeA].children[pathA+'_joint'].addChild(shape[shapeA].children[pathA].clone());
						shape[shapeB].children[pathB+'_joint'].addChild(shape[shapeB].children[pathB].clone());
						shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
						shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					}
					break;
	
				case 'finger joint (angle)':
					var childPath = generateFingerJointA(index, shapeA, pathA, shapeB, pathB, param);
					if (childPath) {
						shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
						shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
						shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
						shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
						shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
						shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					} else {
						shape[shapeA].children[pathA+'_joint'].addChild(shape[shapeA].children[pathA].clone());
						shape[shapeB].children[pathB+'_joint'].addChild(shape[shapeB].children[pathB].clone());
						shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
						shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					}
					break;
					
				case 'hem':
					var childPath = generateHemJoint(index, shapeA, pathA, shapeB, pathB, param);
					var g = new Group();
					g.name = 'folds';
					shape[shapeA].children[pathA+'_joint'].addChild(g);
					shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
					shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					var g2 = new Group();
					g2.name = 'folds';
					shape[shapeB].children[pathB+'_joint'].addChild(g2);
					shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);
					shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					break;
	
				case 'printed rivets':
					// var printTemplate = template;
					console.log("🚀 ~ file: joints.js:358 ~ generateJoint ~ printTemplate", printTemplate)
					
					var G91 = {base:printTemplate.G91Commands.dots, 
						spikes:printTemplate.G91Commands.spikesTall, 
						spikesTop:printTemplate.G91Commands.spikesTop, 
						top:printTemplate.G91Commands.dotsTop
					};

					var childPath = generateDoubleLinePrint(index, shapeA, pathA, shapeB, pathB, param, G91);

					console.log({gcodesInReturn:g, printJobs:childPath.printJobs, returnBFold: childPath.returnBFold, returnB: childPath.returnB, childPath:childPath});

					var g = new Group();
					g.name = 'folds';
					shape[shapeA].children[pathA+'_joint'].printJobs = childPath.printJobs;
					shape[shapeA].children[pathA+'_joint'].addChild(g);
					shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
					// shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
					// shape[shapeA].children[pathA+'_joint'].strokeWidth = 0.2;
	
					shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					// shape[shapeA].children[pathA+'_joint'].strokeColor = '#F00'; // '#000'
					// shape[shapeA].children[pathA+'_joint'].strokeWidth = 0.2;
	
					var g2 = new Group();
					g2.name = 'folds';
					shape[shapeB].children[pathB+'_joint'].addChild(g2);
					shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);

					// shape[shapeB].children[pathB+'_joint'].strokeWidth = 0.5;
	
					shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					// shape[shapeB].children[pathB+'_joint'].strokeColor = '#900';// '#000'
					// shape[shapeB].children[pathB+'_joint'].strokeWidth = 0.5;

					// shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeB].children[pathB+'_joint'].children['folds'].strokeWidth = 0.2;

					var gLaserA = new Group();
					gLaserA.name = 'laser';
					shape[shapeA].children[pathA+'_joint'].addChild(gLaserA);
					shape[shapeA].children[pathA+'_joint'].children['laser'].addChildren(childPath.returnALaser);

					var gLaserB = new Group();
					gLaserB.name = 'laser';
					shape[shapeB].children[pathB+'_joint'].addChild(gLaserB);
					shape[shapeB].children[pathB+'_joint'].children['laser'].addChildren(childPath.returnBLaser);

					var gPrintA = new Group();
					gPrintA.name = 'print';
					shape[shapeA].children[pathA+'_joint'].addChild(gPrintA);
					shape[shapeA].children[pathA+'_joint'].children['print'].addChildren(childPath.returnAPrint);

					var gPrintB = new Group();
					gPrintB.name = 'print';
					shape[shapeB].children[pathB+'_joint'].addChild(gPrintB);
					shape[shapeB].children[pathB+'_joint'].children['print'].addChildren(childPath.returnBPrint);
					console.log("CC ~ file: joints.js:572 ~ req.success ~ childPath:", childPath);
					
					break;
					
				case 'printed running stitch':
					// var printTemplate = template;
					console.log("🚀 ~ file: joints.js:358 ~ generateJoint ~ printTemplate", printTemplate)
					
					var G91 = {base:printTemplate.G91Commands.alternatingLine, 
						spikes:printTemplate.G91Commands.spikes, 
						spikesTop:printTemplate.G91Commands.spikesTop, 
						top:printTemplate.G91Commands.alternatingLineTop
					};

					var childPath = generateDoubleLinePrint(index, shapeA, pathA, shapeB, pathB, param, G91);
					// var g = new Group();
					// g.name = 'folds';
					// shape[shapeA].children[pathA+'_joint'].printJobs = childPath.printJobs;
					// shape[shapeA].children[pathA+'_joint'].addChild(g);
					// shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
					// shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
					// shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					// shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					// shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
					// shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					// var g2 = new Group();
					// g2.name = 'folds';
					// shape[shapeB].children[pathB+'_joint'].addChild(g2);
					// shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);
					// shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
					// shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					// shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					// shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
					// shape[shapeB].children[pathB+'_joint'].strokeWidth = 0.2;

					console.log({gcodesInReturn:g, printJobs:childPath.printJobs, returnBFold: childPath.returnBFold, returnB: childPath.returnB, childPath:childPath});

					var g = new Group();
					g.name = 'folds';
					shape[shapeA].children[pathA+'_joint'].printJobs = childPath.printJobs;
					shape[shapeA].children[pathA+'_joint'].addChild(g);
					shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
					// shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
					// shape[shapeA].children[pathA+'_joint'].strokeWidth = 0.2;
	
					shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					// shape[shapeA].children[pathA+'_joint'].strokeColor = '#F00'; // '#000'
					// shape[shapeA].children[pathA+'_joint'].strokeWidth = 0.2;
	
					var g2 = new Group();
					g2.name = 'folds';
					shape[shapeB].children[pathB+'_joint'].addChild(g2);
					shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);

					// shape[shapeB].children[pathB+'_joint'].strokeWidth = 0.5;
	
					shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					// shape[shapeB].children[pathB+'_joint'].strokeColor = '#900';// '#000'
					// shape[shapeB].children[pathB+'_joint'].strokeWidth = 0.5;

					// shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeB].children[pathB+'_joint'].children['folds'].strokeWidth = 0.2;


					var gLaserA = new Group();
					gLaserA.name = 'laser';
					shape[shapeA].children[pathA+'_joint'].addChild(gLaserA);
					shape[shapeA].children[pathA+'_joint'].children['laser'].addChildren(childPath.returnALaser);

					var gLaserB = new Group();
					gLaserB.name = 'laser';
					shape[shapeB].children[pathB+'_joint'].addChild(gLaserB);
					shape[shapeB].children[pathB+'_joint'].children['laser'].addChildren(childPath.returnBLaser);

					var gPrintA = new Group();
					gPrintA.name = 'print';
					shape[shapeA].children[pathA+'_joint'].addChild(gPrintA);
					shape[shapeA].children[pathA+'_joint'].children['print'].addChildren(childPath.returnAPrint);

					var gPrintB = new Group();
					gPrintB.name = 'print';
					shape[shapeB].children[pathB+'_joint'].addChild(gPrintB);
					shape[shapeB].children[pathB+'_joint'].children['print'].addChildren(childPath.returnBPrint);
	
					break;

				case 'printed baste stitch':
					// var printTemplate = template;
					console.log("🚀 ~ file: joints.js:358 ~ generateJoint ~ printTemplate", printTemplate)
					
					var G91 = {base:printTemplate.G91Commands.baste, 
						spikes:printTemplate.G91Commands.spikes, 
						spikesTop:printTemplate.G91Commands.spikesTop, 
						top:printTemplate.G91Commands.basteTop
					};

					var childPath = generateSingleLinePrint(index, shapeA, pathA, shapeB, pathB, param, G91);
					var g = new Group();
					g.name = 'folds';
					shape[shapeA].children[pathA+'_joint'].printJobs = childPath.printJobs;
					shape[shapeA].children[pathA+'_joint'].addChild(g);
					shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
					shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					var g2 = new Group();
					g2.name = 'folds';
					shape[shapeB].children[pathB+'_joint'].addChild(g2);
					shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);
					shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					console.log({gcodesInReturn:g, printJobs:childPath.printJobs});
					break;

					
				case 'pullable baste stitch':
					// var printTemplate = template;
					console.log("🚀 ~ file: joints.js:358 ~ generateJoint ~ printTemplate", printTemplate)
					
					var G91 = {base:printTemplate.G91Commands.bastePull, 
						spikes:printTemplate.G91Commands.spikes, 
						spikesTop:printTemplate.G91Commands.spikesTop, 
						top:printTemplate.G91Commands.bastePullTop
					};

					var childPath = generateSingleLinePrint(index, shapeA, pathA, shapeB, pathB, param, G91);
					var g = new Group();
					g.name = 'folds';
					shape[shapeA].children[pathA+'_joint'].printJobs = childPath.printJobs;
					shape[shapeA].children[pathA+'_joint'].addChild(g);
					shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
					shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					var g2 = new Group();
					g2.name = 'folds';
					shape[shapeB].children[pathB+'_joint'].addChild(g2);
					shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);
					shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					console.log({gcodesInReturn:g, printJobs:childPath.printJobs});
					break;


				case 'printed decorative stitch':
					// var printTemplate = template;
					console.log("🚀 ~ file: joints.js:736 ~ req.success ~ printTemplate:", printTemplate)
					
					var G91 = {base:printTemplate.G91Commands.spiral, 
						spikes:printTemplate.G91Commands.spikes, 
						spikesTop:printTemplate.G91Commands.spikesTop, 
						top:printTemplate.G91Commands.spiralTop
					};

					var childPath = generateSingleLinePrint(index, shapeA, pathA, shapeB, pathB, param, G91);
					var g = new Group();
					g.name = 'folds';
					shape[shapeA].children[pathA+'_joint'].printJobs = childPath.printJobs;
					shape[shapeA].children[pathA+'_joint'].addChild(g);
					shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
					shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					var g2 = new Group();
					g2.name = 'folds';
					shape[shapeB].children[pathB+'_joint'].addChild(g2);
					shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);
					shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					console.log({gcodesInReturn:g, printJobs:childPath.printJobs});
					break;

				case 'printed whip stitch':
					// var printTemplate = template;
					console.log("🚀 ~ file: joints.js:358 ~ generateJoint ~ printTemplate", printTemplate)
					
					var G91 = {base:printTemplate.G91Commands.whip, 
						spikes:printTemplate.G91Commands.spikes, 
						spikesTop:printTemplate.G91Commands.spikesTop, 
						top:printTemplate.G91Commands.whipTop
					};

					var childPath = generateDoubleLinePrint(index, shapeA, pathA, shapeB, pathB, param, G91);
					// var g = new Group();
					// g.name = 'folds';
					// shape[shapeA].children[pathA+'_joint'].printJobs = childPath.printJobs;
					// shape[shapeA].children[pathA+'_joint'].addChild(g);
					// shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
					// shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
					// shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					// shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					// shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
					// shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					// var g2 = new Group();
					// g2.name = 'folds';
					// shape[shapeB].children[pathB+'_joint'].addChild(g2);
					// shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);
					// shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
					// shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					// shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					// shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
					// shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					// console.log({gcodesInReturn:g, printJobs:childPath.printJobs});
					// break;

					var g = new Group();
					g.name = 'folds';
					shape[shapeA].children[pathA+'_joint'].printJobs = childPath.printJobs;
					shape[shapeA].children[pathA+'_joint'].addChild(g);
					shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
					// shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
					// shape[shapeA].children[pathA+'_joint'].strokeWidth = 0.2;
	
					shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					// shape[shapeA].children[pathA+'_joint'].strokeColor = '#F00'; // '#000'
					// shape[shapeA].children[pathA+'_joint'].strokeWidth = 0.2;
	
					var g2 = new Group();
					g2.name = 'folds';
					shape[shapeB].children[pathB+'_joint'].addChild(g2);
					shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);

					// shape[shapeB].children[pathB+'_joint'].strokeWidth = 0.5;
	
					shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					// shape[shapeB].children[pathB+'_joint'].strokeColor = '#900';// '#000'
					// shape[shapeB].children[pathB+'_joint'].strokeWidth = 0.5;

					// shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeB].children[pathB+'_joint'].children['folds'].strokeWidth = 0.2;

					var gLaserA = new Group();
					gLaserA.name = 'laser';
					shape[shapeA].children[pathA+'_joint'].addChild(gLaserA);
					shape[shapeA].children[pathA+'_joint'].children['laser'].addChildren(childPath.returnALaser);

					var gLaserB = new Group();
					gLaserB.name = 'laser';
					shape[shapeB].children[pathB+'_joint'].addChild(gLaserB);
					shape[shapeB].children[pathB+'_joint'].children['laser'].addChildren(childPath.returnBLaser);

					var gPrintA = new Group();
					gPrintA.name = 'print';
					shape[shapeA].children[pathA+'_joint'].addChild(gPrintA);
					shape[shapeA].children[pathA+'_joint'].children['print'].addChildren(childPath.returnAPrint);

					var gPrintB = new Group();
					gPrintB.name = 'print';
					shape[shapeB].children[pathB+'_joint'].addChild(gPrintB);
					shape[shapeB].children[pathB+'_joint'].children['print'].addChildren(childPath.returnBPrint);
					
					break;

				case 'printed zig zag stitch':
					// var printTemplate = template;
					console.log("🚀 ~ file: joints.js:358 ~ generateJoint ~ printTemplate", printTemplate)
					
					var G91 = {base:printTemplate.G91Commands.zigzag, 
						spikes:printTemplate.G91Commands.spikes, 
						spikesTop:printTemplate.G91Commands.spikesTop, 
						top:printTemplate.G91Commands.zigzagTop
					};

					var childPath = generateDoubleLinePrint(index, shapeA, pathA, shapeB, pathB, param, G91);
					var g = new Group();
					g.name = 'folds';
					shape[shapeA].children[pathA+'_joint'].printJobs = childPath.printJobs;
					shape[shapeA].children[pathA+'_joint'].addChild(g);
					shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
					shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					var g2 = new Group();
					g2.name = 'folds';
					shape[shapeB].children[pathB+'_joint'].addChild(g2);
					shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);
					shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					console.log({gcodesInReturn:g, printJobs:childPath.printJobs});
					break;
				case 'printed cross stitch':
					// var printTemplate = template;
					console.log("🚀 ~ file: joints.js:358 ~ generateJoint ~ printTemplate", printTemplate)
					
					var G91 = {base:printTemplate.G91Commands.cross, 
						spikes:printTemplate.G91Commands.spikes, 
						spikesTop:printTemplate.G91Commands.spikesTop, 
						top:printTemplate.G91Commands.crossTop
					};

					var childPath = generateDoubleLinePrint(index, shapeA, pathA, shapeB, pathB, param, G91);
					var g = new Group();
					g.name = 'folds';
					shape[shapeA].children[pathA+'_joint'].printJobs = childPath.printJobs;
					shape[shapeA].children[pathA+'_joint'].addChild(g);
					shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
					shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					var g2 = new Group();
					g2.name = 'folds';
					shape[shapeB].children[pathB+'_joint'].addChild(g2);
					shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);
					shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					console.log({gcodesInReturn:g, printJobs:childPath.printJobs});
					break;
				case 'tab insert':
					var childPath = generateTabInsertJoint(index, shapeA, pathA, shapeB, pathB, param);
					if (childPath) {
						var g = new Group();
						g.name = 'folds';
						shape[shapeA].children[pathA+'_joint'].addChild(g);
						shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
						shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
						shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
						shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
						shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
						shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
						var g2 = new Group();
						g2.name = 'folds';
						shape[shapeB].children[pathB+'_joint'].addChild(g2);
						shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);
						shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
						shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
						shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
						shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
						shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					} else {
						shape[shapeA].children[pathA+'_joint'].addChild(shape[shapeA].children[pathA].clone());
						shape[shapeB].children[pathB+'_joint'].addChild(shape[shapeB].children[pathB].clone());
						shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
						shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					}
					break;
					
				case 'interlocking':
					var childPath = generateInterlockingJoint(index, shapeA, pathA, shapeB, pathB, param);
					var g = new Group();
					g.name = 'folds';
					shape[shapeA].children[pathA+'_joint'].addChild(g);
					shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
					shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
					shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
					shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
					
					var g2 = new Group();
					g2.name = 'folds';
					shape[shapeB].children[pathB+'_joint'].addChild(g2);
					shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);
					shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
					shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
					shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					break;
	
				case 'flap':
					var childPath = generateFlapJoint(index, shapeA, pathA, shapeB, pathB, param);
					if (childPath) {
						var g = new Group();
						g.name = 'folds';
						shape[shapeA].children[pathA+'_joint'].addChild(g);
						shape[shapeA].children[pathA+'_joint'].children['folds'].addChildren(childPath.returnAFold);
						shape[shapeA].children[pathA+'_joint'].children['folds'].strokeColor = '#AAA';
						shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
						shape[shapeA].children[pathA+'_joint'].addChildren(childPath.returnA);
						shape[shapeA].children[pathA+'_joint'].strokeColor = '#000';
						shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
	
						var g2 = new Group();
						g2.name = 'folds';
						shape[shapeB].children[pathB+'_joint'].addChild(g2);
						shape[shapeB].children[pathB+'_joint'].children['folds'].addChildren(childPath.returnBFold);
						shape[shapeB].children[pathB+'_joint'].children['folds'].strokeColor = '#AAA';
						shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
	
						shape[shapeB].children[pathB+'_joint'].addChildren(childPath.returnB);
						shape[shapeB].children[pathB+'_joint'].strokeColor = '#000';
						shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					} else {
						shape[shapeA].children[pathA+'_joint'].addChild(shape[shapeA].children[pathA].clone());
						shape[shapeB].children[pathB+'_joint'].addChild(shape[shapeB].children[pathB].clone());
						shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
						shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					}
					break;
	
				default:
					shape[shapeA].children[pathA+'_joint'].addChild(shape[shapeA].children[pathA].clone());
					shape[shapeB].children[pathB+'_joint'].addChild(shape[shapeB].children[pathB].clone());
					shape[shapeA].children[pathA+'_joint'].strokeWidth = 1;
					shape[shapeB].children[pathB+'_joint'].strokeWidth = 1;
					break;
			}
		}
		
		console.log('jointLines: ', jointLines);
		console.log('tempLines: ', tempLines);
		console.log('flipLines: ', flipLines);
		console.log('highlight: ', highlight);
		console.log('shape: ', shape);
		

		refreshShapeDisplay();
		activateDim(dimBool);
	});
}

function STLParse( scene ) {
	var vector = new THREE.Vector3();
	var normalMatrixWorld = new THREE.Matrix3();

	var output = "";

	output += "solid exported\n";

	scene.traverse(function(object) {
		if (object instanceof THREE.Mesh) {
			var geometry = object.geometry;
			console.log('geometry: ', geometry);
			var matrixWorld = object.matrixWorld;
			var mesh = object;

			if (geometry instanceof THREE.BufferGeometry) {
				var vertices = geometry.vertices;
				var faces = geometry.faces;

				normalMatrixWorld.getNormalMatrix(matrixWorld);

				for (var i = 0, l = faces.length; i < l; i++) {
					var face = faces[i];

					vector
					.copy(face.normal)
					.applyMatrix3(normalMatrixWorld)
					.normalize();

					output +=
					"\tfacet normal " +
					vector.x +
					" " +
					vector.y +
					" " +
					vector.z +
					"\n";
					output += "\t\touter loop\n";

					var indices = [face.a, face.b, face.c];

					for (var j = 0; j < 3; j++) {
						var vertexIndex = indices[j];
						if (mesh.geometry.skinIndices.length == 0) {
							vector
							.copy(vertices[vertexIndex])
							.applyMatrix4(matrixWorld);
							output +=
							"\t\t\tvertex " +
							(+mesh.position.x + +vector.x) +
							" " +
							(+mesh.position.y + +vector.y) +
							" " +
							(+mesh.position.z + +vector.z) +
							"\n";
						} else {
							vector.copy(vertices[vertexIndex]); //.applyMatrix4( matrixWorld );

							// see https://github.com/mrdoob/three.js/issues/3187
							const boneIndices = [];
							boneIndices[0] = mesh.geometry.skinIndices[vertexIndex].x;
							boneIndices[1] = mesh.geometry.skinIndices[vertexIndex].y;
							boneIndices[2] = mesh.geometry.skinIndices[vertexIndex].z;
							boneIndices[3] = mesh.geometry.skinIndices[vertexIndex].w;

							const weights = [];
							weights[0] = mesh.geometry.skinWeights[vertexIndex].x;
							weights[1] = mesh.geometry.skinWeights[vertexIndex].y;
							weights[2] = mesh.geometry.skinWeights[vertexIndex].z;
							weights[3] = mesh.geometry.skinWeights[vertexIndex].w;

							const inverses = [];
							inverses[0] = mesh.skeleton.boneInverses[boneIndices[0]];
							inverses[1] = mesh.skeleton.boneInverses[boneIndices[1]];
							inverses[2] = mesh.skeleton.boneInverses[boneIndices[2]];
							inverses[3] = mesh.skeleton.boneInverses[boneIndices[3]];

							const skinMatrices = [];
							skinMatrices[0] =
							mesh.skeleton.bones[boneIndices[0]].matrixWorld;
							skinMatrices[1] =
							mesh.skeleton.bones[boneIndices[1]].matrixWorld;
							skinMatrices[2] =
							mesh.skeleton.bones[boneIndices[2]].matrixWorld;
							skinMatrices[3] =
							mesh.skeleton.bones[boneIndices[3]].matrixWorld;

							var finalVector = new THREE.Vector4();
							for (var k = 0; k < 4; k++) {
								var tempVector = new THREE.Vector4(
									vector.x,
									vector.y,
									vector.z
								);
								tempVector.multiplyScalar(weights[k]);
								//the inverse takes the vector into local bone space
								tempVector
									.applyMatrix4(inverses[k])
									//which is then transformed to the appropriate world space
									.applyMatrix4(skinMatrices[k]);
								finalVector.add(tempVector);
							}
							output +=
							"\t\t\tvertex " +
							finalVector.x +
							" " +
							finalVector.y +
							" " +
							finalVector.z +
							"\n";
						}
					}
				output += "\t\tendloop\n";
				output += "\tendfacet\n";
				}
			}
		}
	});

	output += "endsolid exported\n";

	return output;
}

function renderThreads(job, commandObj, returnAPrint, returnBPrint, param) {
	placeConnectionList = [];
	placeBConnectionList = [];
	svgHoleList = [];
	svgBHoleList = [];
	for (let laserHole of job.laserHoles) {
		svgHoleList.push(laserHole.pointOrigin);
		svgBHoleList.push(laserHole.bOrigin);
	}
	addGCodePart("", param, svgHoleList, commandObj.base, 0, false, placeConnectionList); // Just getting the order reference
	addGCodePart("", param, svgBHoleList, commandObj.top, 0, true, placeBConnectionList);
	console.log({placeConnectionList:placeConnectionList, placeBConnectionList:placeBConnectionList, svgBHoleList:svgBHoleList, svgHoleList:svgHoleList});

	var placeConnLists = [placeConnectionList, placeBConnectionList];

	returnList = returnAPrint;
	returnRef = job.renderRef.a;
	for (let placeConnL of placeConnLists) {
		console.log({placeConnL:placeConnL});
		for (let connection of placeConnL) {
			// console.log({connection:connection});
			console.log(connection.to !== null);
			if (connection.to !== null) {
				switch (commandObj.base.renderDetails.type) {
					case "circle":
						var renderPath = new Path.Circle(connection.from, commandObj.base.renderDetails.diameter/2);
						renderPath.name = 'printedCircle';
						renderPath.renderWidth = 0;
						returnList.push(renderPath);
						returnRef.printOutlines.push(renderPath);
						break;
					case "line":
						var renderPath = new Path([connection.from, connection.to]);
						renderPath.name = 'printedLine';
						const outWidth = (connection.from.getDistance(connection.to) / commandObj.base.renderDetails.dLength) * commandObj.base.renderDetails.dWidth;
						// console.log({dist:connection.from.getDistance(connection.to)});
						renderPath.renderWidth = outWidth;
						returnList.push(renderPath);
						returnRef.printLines.push(renderPath);
						// console.log({renderPath:renderPath});
						break;
				}
			} else {
				switch (commandObj.base.renderDetails.type) {
					case "circle":
						var renderPath = new Path.Circle(connection.from, commandObj.base.renderDetails.diameter/2);
						renderPath.name = 'printedCircle';
						renderPath.renderWidth = 0;
						returnList.push(renderPath);
						returnRef.printOutlines.push(renderPath);
						// console.log({rCircle:renderPath});
						break;
					case "line":
						var renderPath = new Path.Circle(connection.from, commandObj.base.renderDetails.skipDiameter/2);
						renderPath.name = 'printedCircle';
						renderPath.renderWidth = 0;
						returnList.push(renderPath);
						returnRef.printOutlines.push(renderPath);
						// console.log({rCircle:renderPath});
						break;
				}
			}
		}
		returnList = returnBPrint;
		returnRef = job.renderRef.b;
	}
	// commandObj.base.renderDetails
}

function doMarkers(job, index, edgeA, edgeB, returnALaser, returnBLaser, returnAPrint, returnBPrint, joints, param, fabID) {

	var markerParams = {size:1, type:"arrow"};
	var markerParams = {size:2, type:"circle"};
	if (param['markertype']) {
		markerParams.type = param['markertype'];
	}

	console.log({job:job});

	var markers = [];

	let markerOffset = job.originSourceOffset + 6; // From start
	let markerOffsetRotated = 6; // From part cut point
	let rotatedPath = job.originSourcePathPart; 
	// console.log({markerOffsetRotated:markerOffsetRotated, markerOffset:markerOffset});
	var startHole = job.laserHoles[0].point;
	
	var markerObj;
	setPrintedMarkers(markerOffset, markerOffsetRotated, markerParams, fabID, index, edgeB, returnBLaser, returnBPrint, job.renderRef.b, joints, false);
	markerObj = setPrintedMarkers(markerOffset, markerOffsetRotated, markerParams, fabID, index, edgeA, returnALaser, returnAPrint, job.renderRef.a, joints, true, rotatedPath);
	if (markerObj.outlines.length > 0) { // If there is something to print // TODO: Or if only text is printed
		markers.push(serverSlicing(markerObj, job, param)); 
	}
	
	
	let markerOffsetE = job.originSourceOffsetEnd - 6; 
	let markerOffsetERotated = (job.originSourcePathPart.length - 6);
	// console.log({markerOffsetRotated:markerOffsetRotated, markerOffsetE:markerOffsetE});

	var markerObjEnd;
	if (Math.abs(markerOffset-markerOffsetE) > markerParams.size) {
		console.log({status:"MarkingEnd"});
		setPrintedMarkers(markerOffsetE, markerOffsetERotated, markerParams, fabID, index, edgeB, returnBLaser, returnBPrint, job.renderRef.b, joints, false);
		markerObjEnd = setPrintedMarkers(markerOffsetE, markerOffsetERotated, markerParams, fabID, index, edgeA, returnALaser, returnAPrint, job.renderRef.a, joints, true, rotatedPath);
		if (markerObj.outlines.length > 0) markers.push(serverSlicing(markerObjEnd, job, param));
	}

	

	
	
	console.log({markers:markers});
	

	
	

	function serverSlicing(markerObj, job, param) {
		var currentID = requestCounter + 0;
		requestCounter += 1;

		console.log({markerObj:markerObj})

		const markerDetails = getMarkerDetails(markerObj);
	
		const relVector = new Point(markerObj.targetPoint.x - job.laserHoles[0].point.x, markerObj.targetPoint.y - job.laserHoles[0].point.y);
	
		console.log({relVector:relVector, targetP:markerObj.targetPoint, startHole: job.laserHoles[0].point});
	
		console.log({markerDetails:markerDetails});
		
	
		var returnObj = {details:markerDetails, sourceObj:markerObj, serverData:undefined};
	
		let markerHeight = param['marker height'];
		if (!markerHeight) markerHeight = 3;
		axios.post('http://127.0.0.1:5505/exportMarkersSTL.cmd', {
			points: markerDetails.pointArray,
			ID: currentID,
			height: markerHeight,
			max_dist: markerDetails.dist,
			x: 0, //markerObj.targetPoint.x,
			y: 0 //markerObj.targetPoint.y
		}).then(function (response) {
			// if (debug) console.log(response);
			var markerGCode = {ID:response.data.ID, markerGC:response.data.gcode, relVector:relVector} ;
			console.log('markerGCode: ', markerGCode);
			markerGCodes.push(markerGCode);
	
			returnObj.serverData = markerGCode;
	
		}).catch(function (error) {
			console.log(error);
		});	
		return returnObj;
	}

	//
	// TODO: Transfer multiple at once for rendering/slicing
	//
	// console.log({targetPointx:markerObj.targetPoint.x, targetPointy:markerObj.targetPoint.y}) //startPoint:startPoint, 
	
	return markers;
}

function setPrintedMarkers(offset, rotOffset, markerParams, fabID, index, edgeAB, returnAB, returnABPrint, renderRefAB, joints, isA, rotPath = undefined) {
	var markerSTLOutlines = [];

	var clonePath;
	var ptAB = edgeAB.getPointAt(offset);
	var ptAB2;
	if (rotPath) {
		ptAB2 = rotPath.getPointAt(rotOffset);
	}

	if (markerParams.type == "circle") {
		var marker = new Path.Circle(ptAB, markerParams.size);
		var crossings = marker.getCrossings(edgeAB);
		// var crossingsB = markerB.getCrossings(edgeB);

		console.log({ptAB:ptAB, markerParams:markerParams});

		// First, add laser paths
		if (crossings.length == 2) {
			var openMarker = marker.split(crossings[0]);
			var splitMarker = openMarker.split(crossings[1]);

			var tinyOffset;
			if (isA) {
				tinyOffset = offsetPath(edgeAB, 0.2, joints[index]['dirM']);
			}
			else {
				tinyOffset = offsetPath(edgeAB, 0.2, joints[index]['dirF']);
			}
			var tinyOffsetPath = new Path(tinyOffset[0].segments);
			var openC = openMarker.getCrossings(tinyOffsetPath);
			var splitC = splitMarker.getCrossings(tinyOffsetPath);

			// console.log("joints[index]['dirM']: ", joints[index]['dirM']);
			
			if (openC.length < splitC.length) {
				clonePath = splitMarker.clone();
				splitMarker.closePath();
				splitMarker.lastCurve._segment1._handleOut._x = 0;
				splitMarker.lastCurve._segment1._handleOut._y = 0;
				splitMarker.lastCurve._segment2._handleIn._x = 0;
				splitMarker.lastCurve._segment2._handleIn._y = 0;
				// markerSTLOutlines.push(splitMarker); // Only 
			} else {
				clonePath = openMarker.clone();
				openMarker.closePath();
				openMarker.lastCurve._segment1._handleOut._x = 0;
				openMarker.lastCurve._segment1._handleOut._y = 0;
				openMarker.lastCurve._segment2._handleIn._x = 0;
				openMarker.lastCurve._segment2._handleIn._y = 0;
				// markerSTLOutlines.push(openMarker);
			}
			clonePath.name = 'cut';
			returnAB.push(clonePath);
			renderRefAB.laserLines.push(clonePath);

			var ouputClone = clonePath.clone();
			ouputClone.name = 'printedMarker';
			returnABPrint.push(ouputClone); // Add printed area to display output
			renderRefAB.printOutlines.push(ouputClone);
		}
	
		// Then, add print paths at rotated path piece
		if (isA && rotPath.length > (rotOffset+markerParams.size)) {
			

			var marker2 = new Path.Circle(ptAB2, markerParams.size);
			var crossings2 = marker2.getCrossings(rotPath);

			console.log({ptABRot:ptAB2, markerParams:markerParams, marker:marker2, crossings:crossings2, rotPath:rotPath, rotOffset:rotOffset});

			
			markerSTLOutlines.push(marker2); // Add print output

			// Only doesn't work for perfectly straight lines..........
			// if (crossings2.length == 2) {
			// 	var openMarker2 = marker2.split(crossings[0]); // This doesn't work, BUT WHY
			// 	var splitMarker2 = openMarker2.split(crossings[1]);

			// 	var tinyOffset2 = offsetPath(rotPath, 0.2, joints[index]['dirM']);

			// 	var tinyOffsetPath2 = new Path(tinyOffset2[0].segments);
			// 	var openC2 = openMarker2.getCrossings(tinyOffsetPath2);
			// 	var splitC2 = splitMarker2.getCrossings(tinyOffsetPath2);

			// 	// console.log("joints[index]['dirM']: ", joints[index]['dirM']);
				
			// 	if (openC2.length < splitC2.length) {
			// 		splitMarker.closePath();
			// 		splitMarker.lastCurve._segment1._handleOut._x = 0;
			// 		splitMarker.lastCurve._segment1._handleOut._y = 0;
			// 		splitMarker.lastCurve._segment2._handleIn._x = 0;
			// 		splitMarker.lastCurve._segment2._handleIn._y = 0;
			// 		markerSTLOutlines.push(splitMarker2);
			// 	} else {
			// 		openMarker.closePath();
			// 		openMarker.lastCurve._segment1._handleOut._x = 0;
			// 		openMarker.lastCurve._segment1._handleOut._y = 0;
			// 		openMarker.lastCurve._segment2._handleIn._x = 0;
			// 		openMarker.lastCurve._segment2._handleIn._y = 0;
			// 		markerSTLOutlines.push(openMarker2);
			// 	}
			// }
		}
	} else if (markerParams.type == "arrow") {
		var halfOffsetPath;
		var fullOffsetPath;
		if (isA) {
			halfOffsetPath = disconnectedOffsetPath(edgeAB, 8, joints[index]['dirM']);
			fullOffsetPath = disconnectedOffsetPath(edgeAB, 20, joints[index]['dirM']);
		}
		else {
			halfOffsetPath = disconnectedOffsetPath(edgeAB, 8, joints[index]['dirF']);
			fullOffsetPath = disconnectedOffsetPath(edgeAB, 20, joints[index]['dirF']);
		}

		const offsetPercentage = (offset / edgeAB.length);
		const targetOffsetHalf = offsetPercentage * halfOffsetPath.length; // Angles arrows for curved lines // Through horrible workaround since normals don't exist
		const targetOffsetFull = offsetPercentage * fullOffsetPath.length;

		var longArrowP = fullOffsetPath.getPointAt(targetOffsetFull);
		var halfArrowP1 = halfOffsetPath.getPointAt((targetOffsetHalf + 4));
		var halfArrowP2 = halfOffsetPath.getPointAt((targetOffsetHalf - 4));

		
		var arrowPoints = [longArrowP, ptAB, halfArrowP1, halfArrowP2, ptAB];
		console.log({offsetPercentage:offsetPercentage, offset:offset, targetOffsetHalf:targetOffsetHalf, targetOffsetFull:targetOffsetFull, edgeAB:edgeAB.length, halfOffsetPath:halfOffsetPath.length, fullOffsetPath:fullOffsetPath.length});
		var arrowPath = new Path(arrowPoints);
		// arrowPath.color = new Color(1, 0, 0);
		// arrowPath.strokeColor = '#F00';
		arrowPath.name = 'mark';
		returnAB.push(arrowPath);


		// CIRLCE!
		// Then, add print paths at rotated path piece
		// TODO: Add printed arrow/text
		if (isA && rotPath.length > (rotOffset+markerParams.size)) {
		

			var marker2 = new Path.Circle(ptAB2, markerParams.size);
			var crossings2 = marker2.getCrossings(rotPath);

			console.log({ptABRot:ptAB2, markerParams:markerParams, marker:marker2, crossings:crossings2, rotPath:rotPath, rotOffset:rotOffset});

			// markerSTLOutlines.push(marker2);
		}
	}

	// Set text markers
	const textOffset = 22;
	var textOffsetPath;
	var startOffset = 4;
	if (isA) {
		textOffsetPath = disconnectedOffsetPath(edgeAB, textOffset, joints[index]['dirM']);
	}
	else {
		textOffsetPath = disconnectedOffsetPath(edgeAB, textOffset, joints[index]['dirF']);
		startOffset = -4;
	}
	const offsetPercentage = (offset / edgeAB.length);
	const targetOffset = offsetPercentage * textOffsetPath.length;

	const startP = textOffsetPath.getPointAt(targetOffset-startOffset);
	const endP = textOffsetPath.getPointAt(targetOffset+startOffset);
	
	const rad = Math.atan2(endP.y-startP.y, endP.x-startP.x)*(180/Math.PI);; // In deg
	console.log(rad)

	var textGroup = generateAsciiPolygons(fabID, startP.x, startP.y, rad, 20);
	console.log({textGroup:textGroup});
	for (let childpath of textGroup.children) {
		childpath.name = 'printedText'
		returnABPrint.push(childpath);
	}

		// PointText replacement (would have to match font and size...)
	// var text = new PointText(new Point(startP.x, startP.y));
	// 	text.fontSize = 8;
	// 	text.fillColor = 'black';
	// 	text.content = fabID;
	// 	text.rotate(rad, startP);
	// 	returnAB.push(text);
	


	// Pprint text markers
	if (rotPath) {

		if (isA) {
			textOffsetPath = disconnectedOffsetPath(rotPath, textOffset, joints[index]['dirM']);
		}
		else {
			textOffsetPath = disconnectedOffsetPath(rotPath, textOffset, joints[index]['dirF']);
			startOffset = -4;
		}

		const offsetPercentage = (offset / edgeAB.length);
		const targetOffset = offsetPercentage * textOffsetPath.length;
	
		const startP = textOffsetPath.getPointAt(targetOffset-startOffset);
		const endP = textOffsetPath.getPointAt(targetOffset+startOffset);
		
		const rad = Math.atan2(endP.y-startP.y, endP.x-startP.x)*(180/Math.PI);; // In deg
		console.log(rad)

		var textGroupPrint = generateAsciiPolygons(fabID, startP.x, startP.y, rad, 20);
		// For each Path, for each pair of points (sliding window of size 2), do add aimed gcode generation
		// Add this to the return, similar to the server-made marker gcode 

		console.log({textGroupPrint:textGroupPrint});
		var printedText = [];
		for (let path of textGroupPrint.children) {
			console.log({ptAB2:ptAB2, point:path.segments[0].point});
			const relVector = new Point(path.segments[0].point.x - ptAB2.x, path.segments[0].point.y - ptAB2.y);
			var onePrintedText = {relVector:relVector, lines:[]};
			for (let segIndex = 0; segIndex < path.segments.length -1; segIndex++) {
				onePrintedText.lines.push({start:path.segments[segIndex].point, end:path.segments[segIndex+1].point})
			}
			printedText.push(onePrintedText);
		}
	}


	return {outlines:markerSTLOutlines, targetPoint:ptAB2, printedText:printedText};
}

function getMarkerDetails(markerObj) {
	console.log({markerObj:markerObj});
	var outline = dividePath(markerObj.outlines[0], 20);
	// Make relative points for print generation
	const xOrigin = markerObj.targetPoint.x; //markerObj.outlines[0].firstSegment.point.x;
	const yOrigin = markerObj.targetPoint.y; //markerObj.outlines[0].firstSegment.point.y;

	var max_dist = 0;
	var curveless_points = [];
	var first = true;
	for (let shortPath of outline) {
		if(first) {
			first = false;
			continue;
		}
		const dist = markerObj.targetPoint.getDistance(shortPath.firstSegment.point);
		if (dist > max_dist) max_dist = dist;
		curveless_points.push(new Point(shortPath.firstSegment.point.x - xOrigin, shortPath.firstSegment.point.y - yOrigin));
	}
	max_dist += 0.1;
	return {pointArray:curveless_points, dist:max_dist};
}


function getOffsetPath(edge, distance, direction) {
	var pathOffset = offsetPath(edge, distance, direction);
	if (pathOffset[0].length < 4) return false;
	else { // Remove connection to base path
		pathOffset[0].segments.pop();
		pathOffset[0].segments.shift();
	}

	var doneOffsetPath = new Path(pathOffset[0].segments);
	return doneOffsetPath;
}


function generateSingleLinePrint(index, shapeA, pathA, shapeB, pathB, param, G91) {
	var returnB = [];
	var returnA = [];
	var returnAFold = [];
	var returnBFold = [];
	// var G91 = printTemplate.G91Commands;
	var G91Obj = G91;
	var skipHoles = Math.floor(param['skip # holes']);

	console.log({warning:"Deprecated"});
	return {'returnA':returnA, 'returnB':returnB, 'returnAFold':returnAFold, 'returnBFold':returnBFold, 'printJobs':{}};

	
	var marking = true;

	var mOrF = false;
	if (joints[index]['dirM']) mOrF = true;

	var totalLength = shape[shapeA].children[pathA].length;
	// Get PCA --> principal length instead
	// Divide into pobs to fit printer
	
	shape[shapeA].children[pathA+'_joint'].addChild(shape[shapeA].children[pathA].clone());
	shape[shapeB].children[pathB+'_joint'].addChild(shape[shapeB].children[pathB].clone());
	var edgeA = shape[shapeA].children[pathA+'_joint'].children[0];
	var edgeB = shape[shapeB].children[pathB+'_joint'].children[0];

	var pathOffsetA = offsetPath(edgeA, param['hem offset'], joints[index]['dirM']);
	if (pathOffsetA[0].length < 4) return false;
	else { // Remove connection to base path
		pathOffsetA[0].segments.pop();
		pathOffsetA[0].segments.shift();
	}

	var pathOffsetB = offsetPath(edgeB, param['hem offset'], joints[index]['dirF']);
	if (pathOffsetB[0].length < 4) return false;
	else { // Remove connection to base path
		pathOffsetB[0].segments.pop();
		pathOffsetB[0].segments.shift();
	}

	// for (path in pathOffsetA) {
	// 	for (seg in path)
	// 		returnA.push(pathOffsetA[i]);
	// }

	var offsetPathA = new Path(pathOffsetA[0].segments);
	var offsetPathB = new Path(pathOffsetB[0].segments);

	for (i in pathOffsetA) { // Why not offsetPathA?
		// returnA.push(pathOffsetA[i]);
	}
	for (i in pathOffsetB) {
		// returnB.push(pathOffsetB[i]);
	}

	// var pathOffsetB = offsetPath(edgeB, param['hem offset'], joints[index]['dirF']);
	// for (i in pathOffsetB) {
	// 	returnB.push(pathOffsetB[i]);
	// }

	if (joints[index]['selfJoining'] == 1) {
		edgeA.dashArray = [4, 4];
	}

	returnAFold.push(edgeA);
	returnBFold.push(edgeB);

	console.log({edgeA:edgeA, pathOffsetA:pathOffsetA[0], offsetPathA:offsetPathA});
	console.log({edgeB:edgeB, pathOffsetB:pathOffsetB[0], offsetPathB:offsetPathB});




	let centerPoint;
	let centerPointB;
	let printJobs = [];
	var laserHoleList = [];
	

	if (param['hole diameter']>0 && param['hole spacing']>0) {
		var holeCount = Math.floor(offsetPathA.length/param['hole spacing']);
		if (Math.floor(offsetPathB.length/param['hole spacing']) < holeCount) {
			holeCount = Math.floor(offsetPathB.length/param['hole spacing']);
			console.warn({message:"hole number does not match, large line length discrepancy"});
		}
		const remainderA = offsetPathA.length-(holeCount*param['hole spacing']);
		const remainderB = offsetPathB.length-(holeCount*param['hole spacing']);
		for (var i=0; i<holeCount; i++) {
			var ptA = offsetPathA.getPointAt(i*param['hole spacing']+param['hole spacing']/2+remainderA/2);
			var ptB = offsetPathB.getPointAt(i*param['hole spacing']+param['hole spacing']/2+remainderB/2);

			let cutCircle = new Path.Circle(ptA, param['hole diameter']/2)
			// cutCircle.strokeColor = new Color(1, 0, 0);
			cutCircle.strokeColor = '#F00';

			returnA.push(cutCircle);
			returnB.push(new Path.Circle(ptB, param['hole diameter']/2));
			returnB[returnB.length-1].strokeColor = '#900';
			if (i == 0) {
				centerPoint = ptA;
				centerPointB = ptB;
			}
			const offsetA = i*param['hole spacing']+param['hole spacing']/2+remainderA/2;

			if (skipHoles >= 1) {
				skipHoles -= 1;
			} else {
				laserHoleList.push({pointOrigin:ptA, offset:offsetA, type:"on-line"});
			}
		}


		// Leave original path in place, use copy
		var copyPath = new Path({segments:offsetPathA.segments, closed:false});


		// Align entire path width-wise (printing build plate left/right-wise)
		let rotationDegs = 10;
		let fullCircle = 0;
		let longestW = {deg:0, width:0};
		while (fullCircle < 360) {
			copyPath.rotate(rotationDegs);
			fullCircle += rotationDegs;
			if (copyPath.strokeBounds.width > longestW.width) {
				longestW.width = copyPath.strokeBounds.width;
				longestW.deg = fullCircle;
			}
		}

		if (longestW.deg != 0) {
			copyPath.rotate(longestW.deg);
		}


		// Rotate to ensure Left To Right on print build plate
		let startP = copyPath.getPointAt(0);
		let endP = copyPath.getPointAt(copyPath.length);
		if (endP.x < startP.x) {
			copyPath.rotate(180);
		}


		let startIndex = 0;
		let endIndex = 0;
		testPoints = [];

		// Separate into print jobs
		var jobs = [{path:copyPath, laserHoles:[], offset:0, originPath:offsetPathA, originSourcePath:edgeA}];
		while (startIndex < (laserHoleList.length-1)) {
			var lastJob = jobs[jobs.length-1];
			
			var laserPoint = lastJob.path.getPointAt(laserHoleList[endIndex].offset - lastJob.offset);
			laserHoleList[endIndex].point = laserPoint;
			lastJob.laserHoles.push(laserHoleList[endIndex]); // point reference
			testPoints.push(laserHoleList[endIndex].point); // "Segment" list for temporary path generation
			
			const testPath = new Path({segments:testPoints, closed:false});
			if (((testPath.strokeBounds.width+10) > param['printing area width'])) {
				let splitPointLength = (laserHoleList[endIndex-1].offset + laserHoleList[endIndex].offset)/2;
				
				splitPointLength -= lastJob.offset;

				// for (let prevJobI = 0; prevJobI < (jobs.length-1); prevJobI++) {
				// 	splitPointLength -= jobs[prevJobI].length;
				// }
				// console.log({splitPointLength:splitPointLength, holeOffset:laserHoleList[endIndex-1].offset, holeOffsetPlus1:laserHoleList[endIndex].offset});

				var splitPoint = lastJob.path.getPointAt(splitPointLength);
				// lastJob.divide(splitPoint);
				let splitPointLocation = lastJob.path.getLocationOf(splitPoint);
				newJobPath = lastJob.path.split(splitPointLocation);
				let newOffset = lastJob.path.length + lastJob.offset;

				jobs.push({path:newJobPath, laserHoles:[], offset:newOffset, originPath:offsetPathA, originSourcePath:edgeA});

				// console.log({newJobL:jobs[jobs.length-1].path.length, lastJobl:lastJob.path.length, jobs:jobs, newJob:jobs[jobs.length-1], lastJob:lastJob});

				startIndex = endIndex;
				testPoints = [];
			}

			endIndex += 1;
			if (endIndex >= laserHoleList.length) {
				break;
			}		
		}


		// handle split jobs (laser+printed markers, printed stitches)
		for (const job of jobs) {
			
			console.log("strokeBoundHeight " + job.path.strokeBounds.height + " Width " + job.path.strokeBounds.width);

			// Rotate job for Left to Right printing
			let rotationDegs = 10;
			let fullCircleLocal = 0;
			let longestWLocal = {deg:0, width:0};
			while (fullCircleLocal < 360) {
				// job.path.rotate(rotationDegs, new Point(job.path.strokeBounds.x, job.path.strokeBounds.y));
				job.path.rotate(rotationDegs);
				fullCircleLocal += rotationDegs;
				if (job.path.strokeBounds.width > longestWLocal.width) {
					longestWLocal.width = job.path.strokeBounds.width;
					longestWLocal.deg = fullCircleLocal;
				}
			}		

			if (longestWLocal.deg != 0) {
				// job.path.rotate(longestWLocal.deg, new Point(job.path.strokeBounds.x, job.path.strokeBounds.y));
				job.path.rotate(longestWLocal.deg);

				// Rotate to ensure Left To Right on print build plate
				let startP = job.path.getPointAt(0);
				let endP = job.path.getPointAt(job.path.length);
				if (endP.x < startP.x) {
					job.path.rotate(180);
					// job.path.rotate(180, new Point(job.path.strokeBounds.x, job.path.strokeBounds.y));
				}
			}

			// Rotate to ensure Left To Right on print build plate
			let startP = job.path.getPointAt(0);
			let endP = job.path.getPointAt(job.path.length);
			if (endP.x < startP.x) {
				job.path.rotate(180);
			}

			console.log("strokeBoundHeightAfter " + job.path.strokeBounds.height + " Width " + job.path.strokeBounds.width );

			var jobRef = job;
			
			var holeList = [];
			var holeCount = job.laserHoles.length;//Math.floor(job.length/param['hole spacing']);

			var startPoint = new Point(0.0, 0.0);
			var maxY = 0;
			var minY = 0;
			for (var i=0; i<holeCount; i++) {
				var ptA = job.laserHoles[i].point; //job.getPointAt(i*param['hole spacing']+param['hole spacing']/2+remainderA/2);
				if (i === 0) {
					startPoint = ptA;
					holeList.push(new Point(0.0, 0.0)); // Position in SVG does not matter for printing
				} else {
					var relativeX = ptA.x - startPoint.x;
					var relativeY = ptA.y - startPoint.y;
					var realtiveP = new Point(relativeX, relativeY);
					holeList.push(realtiveP); // remaining points relative to start point
					if (relativeY > 0) if (maxY < relativeY) maxY = relativeY;
					if (minY > relativeY) minY = relativeY;
				}
			}

			var markers = doMarkers(job, index, edgeA, edgeB, returnA, returnB, joints, param);

			printJobs.push({holeList:holeList, mOrF:mOrF, G91:G91Obj, sourcePath:jobRef.path, usedParam:param, relativeHeight:{max: maxY, min:minY}, markers:markers, handled:false});
		}


		if (false) 
		if (offsetPathA.strokeBounds.width > param['printing area width'])
		{
			let startPoints = [];
			let numberOfJobs = Math.ceil(offsetPathA.length / param['printing area width']);
			let jobLength = offsetPathA.length / numberOfJobs;
			console.log({totalLength:totalLength, offsetPathALength:offsetPathA.length, numberOfJobs:numberOfJobs, areaLength:param['printing area width'], jobLength:jobLength});
			var jobs = [offsetPathA];
			for (let jobNum = 1; jobNum < numberOfJobs; jobNum++) {
				
				var clonePath = offsetPathA.clone();
				clonePath.strokeWidth = 1.0;
				
				let splitP = offsetPathA.getPointAt(jobLength);
				var splitLocation = offsetPathA.getNearestLocation(splitP);

				console.log({splitLocation1:splitLocation._segment1, splitLocation2:splitLocation._segment2});
				let sliptIndex1 = splitLocation._segment1._index;
				let sliptIndex2 = splitLocation._segment2._index;

				console.log({offsetPathA:offsetPathA, clonePath:clonePath, location:splitLocation});

				clonePath.removeSegments(sliptIndex2, clonePath.segments.length);
				offsetPathA.removeSegments(0, sliptIndex1);

				console.log({offsetPathA:offsetPathA, clonePath:clonePath, location:splitLocation});
				// var pathJob = offsetPathA.splitAt(location);
				jobs.push(clonePath);
				
			}

			for (const job of jobs) {
				console.log("strokeBoundHeight " + job.strokeBounds.height + " Width " + job.strokeBounds.width);
				let rotationDegs = 10;
				let fullCircle = 0;
				let longestW = {deg:0, width:0};
				while (fullCircle < 360) {
					job.rotate(rotationDegs, new Point(job.strokeBounds.x, job.strokeBounds.y));
					fullCircle += rotationDegs;
					if (job.strokeBounds.width > longestW.width) {
						longestW.width = job.strokeBounds.width;
						longestW.deg = fullCircle;
					}
				}		

				if (longestW.deg != 0) {
					job.rotate(longestW.deg, new Point(job.strokeBounds.x, job.strokeBounds.y));

					// Rotate to ensure Left To Right on print build plate
					let startP = job.getPointAt(0);
					let endP = job.getPointAt(job.length);
					if (endP.x < startP.x) {
						job.rotate(180, new Point(job.strokeBounds.x, job.strokeBounds.y));
					}
				}

				console.log("strokeBoundHeightAfter " + job.strokeBounds.height + " Width " + job.strokeBounds.width );



				var jobRef = job;
				
				var holeList = [];
				var holeCount = Math.floor(job.length/param['hole spacing']);
				var gapA = job.length/holeCount;
				const remainderA = offsetPathA.length-(holeCount*param['hole spacing']);
				var startPoint = new Point(0.0, 0.0);
				var maxY = 0;
				var minY = 0;
				for (var i=0; i<holeCount; i++) {
					var ptA = job.getPointAt(i*param['hole spacing']+param['hole spacing']/2+remainderA/2);
					// console.log({ptA:ptA});
					if (i === 0) {
						startPoint = ptA;
						holeList.push(new Point(0.0, 0.0)); // Position in SVG does not matter for printing
					} else {
						var relativeX = ptA.x - startPoint.x;
						var relativeY = ptA.y - startPoint.y;
						var realtiveP = new Point(relativeX, relativeY);
						holeList.push(realtiveP); // remaining points relative to start point
						if (relativeY > 0) if (maxY < relativeY) maxY = relativeY;
						if (minY > relativeY) minY = relativeY;
					}
				}
				// var selectedBase = G91.dots;
				// var selectedSpikes = G91.spikes;
				// var selectedSpikesTop = G91.spikesTop;
				// var selectedTop = G91.dotsTop;

				var markerSTLOutlines = [];
				printJobs.push({holeList:holeList, mOrF:mOrF, G91:G91, sourcePath:jobRef, usedParam:param, relativeHeight:{max: maxY, min:minY}, markerSTLOutlines:markerSTLOutlines, handled:false});
			}

		} else {
			var holeList = [];
			var holeCount = Math.floor(offsetPathA.length/param['hole spacing']);
			var gapA = offsetPathA.length/holeCount;
			const remainderA = offsetPathA.length-(holeCount*param['hole spacing']);
			var startPoint = new Point(0.0, 0.0);
			var maxY = 0;
			var minY = 0;
			for (var i=0; i<holeCount; i++) {
				var ptA = offsetPathA.getPointAt(i*param['hole spacing']+param['hole spacing']/2+remainderA/2);
				console.log({ptA:ptA});
				if (i === 0) {
					startPoint = ptA;
					holeList.push(new Point(0.0, 0.0)); // Position in SVG does not matter for printing
				} else {
					var relativeX = ptA.x - startPoint.x;
					var relativeY = ptA.y - startPoint.y;
					var realtiveP = new Point(relativeX, relativeY);
					holeList.push(realtiveP); // remaining points relative to start point
					if (relativeY > 0) if (maxY < relativeY) maxY = relativeY;
					if (minY > relativeY) minY = relativeY;
				}
				
			}

			var offsetPathAOrigin = new Path(pathOffsetA[0].segments);
			var ptAOrigin = offsetPathAOrigin.getPointAt(param['hole spacing']/2+remainderA/2);

			var markerObj = setPrintedMarkers(index, edgeA, edgeB, returnA, returnB, joints);

			console.log({startPoint:startPoint, targetPointx:markerObj.targetPoint.x, targetPointy:markerObj.targetPoint.y})

			var markerDetails = getMarkerDetails(markerObj);

			const relX = markerObj.targetPoint.x - ptAOrigin.x;
			const relY = markerObj.targetPoint.y - ptAOrigin.y;

			console.log({markerDetails:markerDetails});
			// var payload = {markerSTLOutlines:markerDetails.pointArray, ID:requestCounter, x:relX, y:relY, max_dist:markerDetails.dist};
			var currentID = requestCounter + 0;
			var testload = {cont:"test"};
			requestCounter += 1;
			var success = function(data)
				   {
					   alert(data); // show response from the php script.
				   }
			// $.post("http://127.0.0.1:5501/exportMarkersSTL.php", {test:"test"}, success, {contentType: 'application/json'}); //data : JSON.stringify(something), 


			// var url = "http://127.0.0.1:5501/exportMarkersSTL.php?data="+JSON.stringify(payload); // the script where you handle the form input.
			// var package = JSON.stringify(payload);
			var jsond = JSON.stringify(testload);

			var url = "http://127.0.0.1:5501/exportMarkersSTL.php";

			// $.ajax({
			// 	   type: "POST",
			// 	   url: "http://127.0.0.1:5501/exportMarkersSTL.fuck",
			// 	   contentType: "application/json",
			// 	//    data: $("#idForm").serialize(), // serializes the form's elements.
			// 		// data: package,
			// 		// processData: false,
			// 		dataType: 'json',
			// 			data: jsond,
			// 		// $.ajax({
			// 		// 	type: "POST",
			// 		// 	url: 'localhost/pages/register.php',
						
			// 		// })
			// 		 error : function(err){
			// 			 console.log("Error: " + err); //just use the err here
			// 		 },
			// 	   success: function(data)
			// 	   {
			// 		   console.log({data}); // show response from the php script.
			// 	   }
			// 	 });
			let markerHeight = param['marker height'];
			if (!markerHeight) markerHeight = 3;
			axios.post('http://127.0.0.1:5501/exportMarkersSTL.cmd', {
				points: markerDetails.pointArray,
				ID: currentID,
				height: markerHeight,
				max_dist: markerDetails.dist,
				x: relX,
				y: relY
			}).then(function (response) {
				// if (debug) console.log(response);
				var markerGCode = {ID:response.data.ID, markerGC:response.data.gcode} ;
				console.log('markerGCode: ', markerGCode);
				markerGCodes.push(markerGCode);

			}).catch(function (error) {
				console.log(error);
			});

			// var selectedBase = G91.alternatingLine;
			// var selectedSpikes = G91.spikes;
			// var selectedSpikesTop = G91.spikesTop;
			// var selectedTop = G91.alternatingLineTop;
			printJobs.push({holeList:holeList, mOrF:mOrF, G91:G91, sourcePath:offsetPathA, usedParam:param, relativeHeight:{max: maxY, min:minY}, markerSTLOutlines:markerSTLOutlines, markerID:currentID, handled:false});
		}	
		
	}
	

	shape[shapeA].children[pathA+'_joint'].removeChildren();
	shape[shapeB].children[pathB+'_joint'].removeChildren();

	return {'returnA':returnA, 'returnB':returnB, 'returnAFold':returnAFold, 'returnBFold':returnBFold, 'printJobs':printJobs};
}


function generateDoubleLinePrint(index, shapeA, pathA, shapeB, pathB, param, G91) {
	var returnB = [];
	var returnA = [];
	var returnAFold = [];
	var returnBFold = [];
	var returnBLaser = [];
	var returnALaser = [];
	var returnBPrint = [];
	var returnAPrint = [];
	var G91Obj = G91;
	var skipHoles = Math.floor(param['skip # holes']);

	// Handling for simple case (non-)patterns
	let patternWidth;
	let holePattern;
	let holePatternOffset;

	if (param['pattern width'] == undefined) {
		patternWidth = 1;
	} else {
		patternWidth = param['pattern width'];
	}
	if (G91Obj.base.upDownPattern == undefined) {
		holePattern = [0];
	} else {
		holePattern = G91Obj.base.upDownPattern;
	}
	if (G91Obj.base.upDownOffset == undefined) {
		holePatternOffset = [0];
	} else {
		holePatternOffset = G91Obj.base.upDownOffset;
	}
	var mOrF = false;
	if (joints[index]['dirM']) mOrF = true;


	// TODO: Avoid adding a clone to the shape
	// Avoid cloning the path, make new copy of segments
	shape[shapeA].children[pathA+'_joint'].addChild(shape[shapeA].children[pathA].clone()); // Adds a copy of the path to the joint
	shape[shapeB].children[pathB+'_joint'].addChild(shape[shapeB].children[pathB].clone());
	var edgeA = shape[shapeA].children[pathA+'_joint'].children[0];
	var edgeB = shape[shapeB].children[pathB+'_joint'].children[0];

	if (param['hem offset'] < patternWidth) {
		console.error({message:"hem offset must be larger than pattern width"});
	}

	console.log({Pink:param['pinking cut']});

	if (param['pinking cut'] == true) {
		console.log({status:"Pinking"});
		const pinkingDepth = 3;
		const pinkingDist = pinkingDepth * 0.75;

		var pinkingPathA = getOffsetPath(edgeA, (-pinkingDepth), joints[index]['dirM']);
		var pinkingPathB = getOffsetPath(edgeB, (-pinkingDepth), joints[index]['dirF']);

		console.log({pinkingPathA:pinkingPathA, pinkingPathB:pinkingPathB});


		function getPointOnNormal(path, offset, distance, direction) {
			var pointOnPath = path.getPointAt(offset);
			var normalVector = path.getNormalAt(offset);
			var offsetVector = normalVector.normalize(distance); 
			// console.log(direction);
			// if (direction == false) {
				offsetVector = offsetVector.multiply(direction);
			// }
			var pointDistAway = pointOnPath.add(offsetVector);
			return pointDistAway;
		}

		// console.log("edgeAP");
		// for (let seg of edgeA.segments) {
		// 	console.log({x:seg._point._x, y:seg._point._y});
		// }
		// console.log("edgeBP");
		// for (let seg of edgeB.segments) {
		// 	console.log({x:seg._point._x, y:seg._point._y});
		// }

		var pinkingCountA = Math.floor(edgeA.length/(pinkingDist));
		var pinkingCountB = Math.floor(edgeB.length/(pinkingDist));
		const remainderA = edgeA.length-(pinkingCountA*pinkingDist);
		const remainderB = edgeB.length-(pinkingCountB*pinkingDist);

		console.log({pinkingCountA:pinkingCountA, pinkingCountB:pinkingCountB, remainderA:remainderA, remainderB:remainderB});

		var pathAStart = shape[shapeA].children[pathA].firstSegment.point;
		var pathAEnd = shape[shapeA].children[pathA].lastSegment.point;
		var pathBStart = shape[shapeB].children[pathB].firstSegment.point;
		var pathBEnd = shape[shapeB].children[pathB].lastSegment.point;

		var pinkedPointsA = [edgeA.firstSegment.point];
		var pinkedPointsB = [edgeB.firstSegment.point];
		// var pinkedPointsA = [pathAStart];
		// var pinkedPointsB = [pathBStart];

		var alternate = true;
		for (var i=0; i<pinkingCountA; i++) {
			
			const pOffsetA = (i*pinkingDist)+remainderA;

			if (alternate) {
				const offsetPercentageA = (pOffsetA / edgeA.length);
				const targetOffsetA = offsetPercentageA * pinkingPathA.length;
				var pt = pinkingPathA.getPointAt(targetOffsetA);
				
				var nPt = getPointOnNormal(edgeA, pOffsetA, -pinkingDepth, joints[index]['dirM']);
				// console.log({nPtX:nPt.x, nPtY:nPt.y});
				// console.log({ptX:pt.x, ptY:pt.y});
				pinkedPointsA.push(nPt);
				
			} else {
				var pt = edgeA.getPointAt(pOffsetA);
				pinkedPointsA.push(pt);
			}
			alternate = !alternate;
		}
		pinkedPointsA.push(edgeA.lastSegment.point);

		alternate = true;
		for (var i=0; i<pinkingCountB; i++) {
			
			const pOffsetB = (i*pinkingDist)+remainderB;

			if (alternate) {
				const offsetPercentageB = (pOffsetB / edgeB.length);
				const targetOffsetB = offsetPercentageB * pinkingPathB.length;
				var pt = pinkingPathB.getPointAt(targetOffsetB);
				
				var nPt = getPointOnNormal(edgeB, pOffsetB, -pinkingDepth, joints[index]['dirF']);
				// console.log({nPtX:nPt.x, nPtY:nPt.y});
				// console.log({ptX:pt.x, ptY:pt.y});
				pinkedPointsB.push(nPt);
				
			} else {
				var pt = edgeB.getPointAt(pOffsetB);
				pinkedPointsB.push(pt);
			}
			alternate = !alternate;
		}
		pinkedPointsB.push(edgeB.lastSegment.point);

		// console.log({pinkedPointsA:pinkedPointsA, pinkedPointsB:pinkedPointsB});


		var pinkedA = new Path({segments:pinkedPointsA, closed:false});
		var pinkedB = new Path({segments:pinkedPointsB, closed:false});

		var offsetPA = new Path({segments:pinkingPathA, closed:false});
		var offsetPB = new Path({segments:pinkingPathB, closed:false});
		pinkedA.name = 'cut';
		pinkedB.name = 'cut';
		pinkedA.strokeColor = laserColor;
		pinkedA.strokeWidth = laserWidth;
		pinkedB.strokeColor = laserColor;
		pinkedB.strokeWidth = laserWidth;
		pinkedA.fillColor = noColor;
		pinkedB.fillColor = noColor;

		returnALaser.push(pinkedA);
		returnBLaser.push(pinkedB);

		// returnA.push(offsetPA);
		// returnB.push(offsetPB);
	}


	var targetingPathA = getOffsetPath(edgeA, (param['hem offset']+1), joints[index]['dirM']);
	var targetingPathB = getOffsetPath(edgeB, (param['hem offset']+1), joints[index]['dirF']);
	var holePathFarA = getOffsetPath(edgeA, (param['hem offset']), joints[index]['dirM']);
	var holePathFarB = getOffsetPath(edgeB, (param['hem offset']), joints[index]['dirF']);
	var holePathNearA = getOffsetPath(edgeA, (param['hem offset']-patternWidth), joints[index]['dirM']);
	var holePathNearB = getOffsetPath(edgeB, (param['hem offset']-patternWidth), joints[index]['dirF']);


	// TODO: Include edgeA and edgeB in the line list directly
	var aLines = [holePathFarA, holePathNearA];
	var bLines = [holePathFarB, holePathNearB];

	// var edgeACopy = edgeA.clone(); // Never clone, this adds the line directly to the canvas 

	var edgeACopy = new Path({segments:edgeA.segments, closed:false});

	// returnAFold.push(edgeA);
	// returnBFold.push(edgeB);

	let centerPoint;
	let centerPointB;
	let printJobs = [];

	var laserHoleList = [];
	
	if (param['hole diameter']>0 && param['hole spacing']>0) {
		var holeCount = Math.floor(aLines[0].length/param['hole spacing']);
		if (Math.floor(bLines[0].length/param['hole spacing']) < holeCount) {
			holeCount = Math.floor(bLines[0].length/param['hole spacing']);
			console.warn({message:"hole number does not match; large line length discrepancy"});
		}
		const remainderA = aLines[0].length-(holeCount*param['hole spacing']);
		const remainderB = bLines[0].length-(holeCount*param['hole spacing']);
		var patternIndex = 0;
				
		for (var i=0; i<holeCount; i++) {
			
			const sourceOffsetA = (i+holePatternOffset[patternIndex])*param['hole spacing']+param['hole spacing']/2+remainderA/2;
			const sourceOffsetB = (i+holePatternOffset[patternIndex])*param['hole spacing']+param['hole spacing']/2+remainderB/2;
			var ptA = aLines[0].getPointAt(sourceOffsetA);
			var ptB = bLines[0].getPointAt(sourceOffsetB);
			var offsetA = sourceOffsetA;

			const sourceOffsetPercentageA = (sourceOffsetA / aLines[0].length);
			const originSourceOffsetA = sourceOffsetPercentageA * edgeA.length;

			var circleA;
			var circleB;

			if (holePattern[patternIndex] == 0) { //TODO: This should probably just be merged with the other cases
				
				if (i == 0) {
					centerPoint = ptA;
					centerPointB = ptB;
				}
			} else { // Normals don't exist, so we use percentage of the offset instead
				const offsetPercentageA = (sourceOffsetA / aLines[0].length);
				const offsetPercentageB = (sourceOffsetB / bLines[0].length);
				const targetOffsetA = offsetPercentageA * aLines[holePattern[patternIndex]].length;
				const targetOffsetB = offsetPercentageB * bLines[holePattern[patternIndex]].length;

				ptA = aLines[holePattern[patternIndex]].getPointAt(targetOffsetA);
				ptB = bLines[holePattern[patternIndex]].getPointAt(targetOffsetB);
				offsetA = aLines[holePattern[patternIndex]].getOffsetOf(ptA);
			}

			var minDist = 10;
			if (param['total seam width'] != undefined) minDist = param['total seam width'];

			// check whether the points are close to other prints (within minDist) through shape

			if (skipHoles >= 1) {
				skipHoles -= 1;
			} else {
				var closeToOtherPrints = checkMinDist(ptA, ptB, minDist);
				console.log('closeToOtherPrints: ', closeToOtherPrints);
				if (!closeToOtherPrints) {
					const patternIndexRef = patternIndex + 0;
					laserHoleList.push({pointOrigin:ptA, bOrigin:ptB, offset:offsetA, offsetOrigin:sourceOffsetA, offsetOriginSource:originSourceOffsetA, type:"on-line", lineIndex:patternIndexRef});

					patternIndex += 1;
					if (patternIndex >= holePattern.length) patternIndex = 0;

					circleA = new Path.Circle(ptA, param['hole diameter']/2);
					circleB = new Path.Circle(ptB, param['hole diameter']/2);
					circleA.name = 'cut';
					circleB.name = 'cut';
					circleA.strokeColor = laserColor;
					circleB.strokeColor = laserColor;
					circleA.strokeWidth = laserWidth;
					circleB.strokeWidth = laserWidth;
					circleA.fillColor = noColor;
					circleB.fillColor = noColor;
					returnALaser.push(circleA);
					returnBLaser.push(circleB);
				}
			}
		}

		// Leave original path in place, use copy
		var copyPaths = [];
		for (let onePath of aLines) {
			var copyP = new Path({segments:onePath.segments, closed:false});
			copyPaths.push(copyP);
		}
		// copyPath = new Path({segments:aLines[0].segments, closed:false});
		copyPath = copyPaths[0];


		var pathsGroup = new Group(copyPaths);
		console.log({pathsGroup:pathsGroup});
		// pathsGroup.children.push(edgeACopy);
		var laserPointSet = [];
		for (let laserHole of laserHoleList) {
			laserPointSet.push(laserHole.pointOrigin);
		}
		var laserPointsPath = new Path(laserPointSet);
		var laserPointsPathUnchanged = new Path(laserPointSet);

		for (let laserHole of laserHoleList) {
			const patternedOffset = laserPointsPath.getOffsetOf(laserHole.pointOrigin);
			laserHole.patternedOffset = patternedOffset;
			laserHole.laserPointsPath = laserPointsPath;
		}


		// Align entire path width-wise (printing build plate left/right-wise)
		let rotationDegs = 10;
		let fullCircle = 0;
		let longestW = {deg:0, width:0};
		let rotP = new Point(laserPointsPath.strokeBounds.x, laserPointsPath.strokeBounds.y);
		while (fullCircle < 360) {
			pathsGroup.rotate(rotationDegs, rotP);
			// for (let onePath of copyPaths) {
			// 	onePath.rotate(rotationDegs);
			// }
			// copyPath.rotate(rotationDegs);
			laserPointsPath.rotate(rotationDegs, rotP);
			fullCircle += rotationDegs;
			if (laserPointsPath.strokeBounds.width > longestW.width) {
				longestW.width = laserPointsPath.strokeBounds.width;
				longestW.deg = fullCircle;
			}
		}

		if (longestW.deg != 0) {
			pathsGroup.rotate(longestW.deg, rotP);
			// for (let onePath of copyPaths) {
			// 	onePath.rotate(longestW.deg);
			// }
			// copyPath.rotate(longestW.deg);
			laserPointsPath.rotate(longestW.deg, rotP);
		}


		// Rotate to ensure Left To Right on print build plate
		let startP = laserPointsPath.getPointAt(0);
		let endP = laserPointsPath.getPointAt(laserPointsPath.length);
		if (endP.x < startP.x) {
			pathsGroup.rotate(180, rotP);
			// for (let onePath of copyPaths) {
			// 	onePath.rotate(180);
			// }
			// copyPath.rotate(180);
			laserPointsPath.rotate(180, rotP);
		}

		// returnAFold.push(laserPointsPath);


		let startIndex = 0;
		let endIndex = 0;
		testPoints = [];
		var offsets = [];
		for (let onePath of copyPaths) {
			offsets.push(0);
		}

		console.log({laserHoleList:laserHoleList});


		pathsGroup.rotate(30, rotP);
		// Separate into print jobs
		var renderRef1 = {a:{laserLines:[], printLines:[], printOutlines:[]}, b:{laserLines:[], printLines:[], printOutlines:[]}};
		var jobs = [{path:laserPointsPath, renderRef:renderRef1, laserHoles:[], offset:0, originPath:aLines[0], originSourcePath:edgeA, originSourcePathPart:edgeACopy, originSourceOffset:0, originSourcePartOffset:0}];
		while (startIndex < (laserHoleList.length-1)) {
			var lastJob = jobs[jobs.length-1];

			// console.log({thePath:lastJob.path, patternedOffset:laserHoleList[endIndex].patternedOffset});
			
			var theOffset = (Math.floor((laserHoleList[endIndex].patternedOffset - lastJob.offset) * 10000) / 10000);
			if (lastJob.path.length < theOffset) {
				console.warn("offset longer than path. Setting to path length. Difference was: ", (theOffset - lastJob.path.length), lastJob.path.length, theOffset);
				theOffset = lastJob.path.length;
			}

			var laserPoint = lastJob.path.getPointAt(theOffset);
			// console.log({laserPoint:laserPoint, pathL:lastJob.path.length, OffSet: theOffset});
			laserHoleList[endIndex].point = laserPoint;
			lastJob.laserHoles.push(laserHoleList[endIndex]); // point reference
			testPoints.push(laserHoleList[endIndex].point); // "Segment" list for temporary path generation
			// console.log('testPoints: ', testPoints);
			
			const testPath = new Path({segments:testPoints, closed:false});
			// console.log({testPath:testPath});
			if (((testPath.strokeBounds.width+10) > param['printing area width'])) {
				let splitPointLength = (laserHoleList[endIndex].patternedOffset + laserHoleList[endIndex+1].patternedOffset)/2;

				// const originSourceSplitPL = laserHoleList[endIndex].offsetOriginSource; // Why? offsetOriginSource not far along enough somehow?
				const originSourceSplitPL = (laserHoleList[endIndex].offsetOriginSource + laserHoleList[endIndex+1].offsetOriginSource)/2;
				const originSourcePartSplitPL = originSourceSplitPL - lastJob.originSourcePartOffset;
				
				splitPointLength -= lastJob.offset;

				// for (let prevJobI = 0; prevJobI < (jobs.length-1); prevJobI++) {
				// 	splitPointLength -= jobs[prevJobI].length;
				// }

				// console.log({splitPointLength:splitPointLength, holeOffset:laserHoleList[endIndex-1].offset, holeOffsetPlus1:laserHoleList[endIndex].offset});

				var splitPoint = lastJob.path.getPointAt(splitPointLength);
				// lastJob.divide(splitPoint);
				let splitPointLocation = lastJob.path.getLocationOf(splitPoint);
				newJobPath = lastJob.path.split(splitPointLocation);
				let newOffset = lastJob.path.length + lastJob.offset;

				var originSourcePathPart = lastJob.originSourcePathPart.split(originSourcePartSplitPL);//lastJob.originSourcePathPart.getLocationOf(originSourcePartSplitPL));

				// returnAFold.push(originSourcePathPart);
				var renderRef = {a:{laserLines:[], printLines:[], printOutlines:[]}, b:{laserLines:[], printLines:[], printOutlines:[]}};

				jobs.push({path:newJobPath, renderRef:renderRef, laserHoles:[], offset:newOffset, originPath:aLines[0], originSourcePath:edgeA, originSourcePathPart:originSourcePathPart, originSourceOffset:originSourceSplitPL, originSourcePartOffset:originSourcePartSplitPL});

				// console.log({newJobL:jobs[jobs.length-1].path.length, lastJobl:lastJob.path.length, jobs:jobs, newJob:jobs[jobs.length-1], lastJob:lastJob});

				startIndex = endIndex;
				testPoints = [];
			}

			endIndex += 1;
			if (endIndex >= laserHoleList.length) {
				break;
			}		
		}

		let lastJ = undefined;
		for (const job of jobs) {
			if (lastJ) {
				lastJ.originSourceOffsetEnd = job.originSourceOffset;
			}
			lastJ = job;
		}
		jobs[jobs.length-1].originSourceOffsetEnd = jobs[jobs.length-1].originSourcePath.length;


		// handle split jobs (laser+printed markers, printed stitches)
		for (let job of jobs) {
			
			console.log("strokeBoundHeight " + job.path.strokeBounds.height + " Width " + job.path.strokeBounds.width);

			var printJobID = (parseInt(shapeA)+1).toString() + "+" + (parseInt(shapeB)+1).toString() + getAlphaID(printCounter);

			if (emptyIDs) printJobID = "";
			printCounter++;

			// Rotate job for Left to Right printing
			let rotationDegs = 10;
			let fullCircle = 0;
			let longestW = {deg:0, width:0};
			let rotPoint = new Point(job.path.strokeBounds.x, job.path.strokeBounds.y);
			while (fullCircle < 360) {
				// console.log({rotPoint:rotPoint, x:job.path.strokeBounds.x, y:job.path.strokeBounds.y});
				job.originSourcePathPart.rotate(rotationDegs, rotPoint);
				job.path.rotate(rotationDegs, rotPoint);
				fullCircle += rotationDegs;
				if (job.path.strokeBounds.width > longestW.width) {
					longestW.width = job.path.strokeBounds.width;
					longestW.deg = fullCircle;
				}
			}		

			if (longestW.deg != 0) {
				job.path.rotate(longestW.deg, rotPoint);
				job.originSourcePathPart.rotate(longestW.deg, rotPoint);
				// Rotate to ensure Left To Right on print build plate
				let startP = job.path.getPointAt(0);
				let endP = job.path.getPointAt(job.path.length);
				if (endP.x < startP.x) {
					job.path.rotate(180, rotPoint);
					job.originSourcePathPart.rotate(180, rotPoint);
				}
			}

			console.log("strokeBoundHeightAfter " + job.path.strokeBounds.height + " Width " + job.path.strokeBounds.width );

			var jobRef = job;
			
			var holeList = [];
			var holeCount = job.laserHoles.length;//Math.floor(job.length/param['hole spacing']);

			var startPoint = new Point(0.0, 0.0);
			var maxY = 0;
			var minY = 0;
			for (var i=0; i<holeCount; i++) {
				var ptA = job.laserHoles[i].point; //job.getPointAt(i*param['hole spacing']+param['hole spacing']/2+remainderA/2);
				// console.log({ptA:ptA});
				if (i === 0) {
					startPoint = ptA;
					holeList.push(new Point(0.0, 0.0)); // Position in SVG does not matter for printing
				} else {
					var relativeX = ptA.x - startPoint.x;
					var relativeY = ptA.y - startPoint.y;
					var realtiveP = new Point(relativeX, relativeY);
					holeList.push(realtiveP); // remaining points relative to start point
					console.log({realtiveP:realtiveP});
					if (relativeY > 0) if (maxY < relativeY) maxY = relativeY;
					if (minY > relativeY) minY = relativeY;
				}
			}

			var laserHolesRef = [];
			for (let laserHole of jobRef.laserHoles) {
				laserHolesRef.push(laserHole.pointOrigin);
			}
			var laserHolesRefPath = new Path(laserHolesRef);

			var markers = doMarkers(job, index, edgeA, edgeB, returnALaser, returnBLaser, returnAPrint, returnBPrint, joints, param, printJobID);

			renderThreads(job, G91Obj, returnAPrint, returnBPrint, param);

			printJobs.push({fabID:printJobID, holeList:holeList, renderRef:job.renderRef, mOrF:mOrF, G91:G91Obj, sourcePath:jobRef.path, usedParam:param, relativeHeight:{max: maxY, min:minY}, markers:markers, laserHolesRefPath:laserHolesRefPath, handled:false});

		}
		
	}

	if (!emptyIDs) {
		var testPath = generateAsciiPolygons(".PB", projectBounds.minX, projectBounds.minY, -90, 10);
		console.log({testPath:testPath});
		returnA.push(testPath);
		var text = new PointText(new Point(projectBounds.minX, projectBounds.minY));
		text.fillColor = 'black';
		text.content = Math.round(projectBounds.minX) + ' ' + Math.round(projectBounds.minY);
		text.fontSize = 4.2;
		returnA.push(text);
	}

	shape[shapeA].children[pathA+'_joint'].removeChildren();
	shape[shapeB].children[pathB+'_joint'].removeChildren();

	return {'returnA':returnA, 'returnB':returnB, 'returnAFold':returnAFold, 'returnBFold':returnBFold, 'printJobs':printJobs, 'returnALaser':returnALaser, 'returnAPrint':returnAPrint, 'returnBLaser':returnBLaser, 'returnBPrint':returnBPrint};
}

function generateFingerJointA(index, shapeA, pathA, shapeB, pathB, param) {
	var returnA = [];
	var returnB = [];
	var generateBool = true;
	if (shape[shapeA].children[pathA].segments.length==2 && shape[shapeB].children[pathB].segments.length==2) {
		for (i in shape[shapeA].children[pathA].segments) {
			if (shape[shapeA].children[pathA].segments[i].hasHandles()) {
				generateBool = false;
			}
		}
		for (i in shape[shapeB].children[pathB].segments) {
			if (shape[shapeB].children[pathB].segments[i].hasHandles()) {
				generateBool = false;
			}
		}
	} else {
		setMessage('<b>Paths have more than two points</b> Joint generated based on the start and end points.', '#F80');
	}
	if (!generateBool) {
		setMessage('<b>Paths are not straight</b> Joint generated based on the start and end points.', '#F80');
	} 
	if (param['interior angle'] < 30 || param['interior angle'] > 330 ) {
		setMessage('<b>"interior angle" not between 30 and 330 degrees</b> Joint not generated.', '#F80');
		return false;
	} else {
		var intAngle = param['interior angle']/180*Math.PI;
		var ascend = 0;
		var descend = 0;
		if (intAngle<=Math.PI/2) {
			ascend = (param['material thickness'])/Math.cos(Math.PI/2-intAngle);
		} else if (intAngle>Math.PI/2 && intAngle<=Math.PI) {
			ascend = (param['material thickness'])*(Math.tan(Math.PI/2-intAngle/2));
			descend = ascend*Math.cos(Math.PI-intAngle);
		} else if (intAngle>Math.PI && intAngle<Math.PI*1.5) {
			descend = 2*param['material thickness']*Math.sin(intAngle/4-Math.PI/4)*Math.cos(intAngle/4-Math.PI/4);
		} else if (intAngle>=Math.PI*1.5) {
			descend = param['material thickness']/(Math.tan((Math.PI*2-intAngle)/2));
		}
		if (ascend==0 && descend==0) {
			return false;
		} else {
			var pathAStart = shape[shapeA].children[pathA].firstSegment.point;
			var pathAEnd = shape[shapeA].children[pathA].lastSegment.point;
			var pathBStart = shape[shapeB].children[pathB].firstSegment.point;
			var pathBEnd = shape[shapeB].children[pathB].lastSegment.point;
			var dirA = pathAEnd.subtract(pathAStart).normalize();
			var dirB = pathBEnd.subtract(pathBStart).normalize();
			var normA = new Point(dirA.y, -dirA.x);
			var normB = new Point(dirB.y, -dirB.x);
			var fingerCount = Math.floor(pathAStart.getDistance(pathAEnd)/(param['finger width']*2))*2;
			var gap = pathAStart.getDistance(pathAEnd)/fingerCount;
			var pathAStartCloneIndex = -1;
			var pathAEndCloneIndex = -1;
			var pathBStartCloneIndex = -1;
			var pathBEndCloneIndex = -1;
			for (i in shape[shapeA].children) {
				if (i!=pathA && shape[shapeA].children[i].className=='Path') {
					var d1 = pathAStart.getDistance(shape[shapeA].children[i].firstSegment.point);
					var d2 = pathAStart.getDistance(shape[shapeA].children[i].lastSegment.point);
					if ((d1<0.1 || d2<0.1) && !isNaN(i)) {
						pathAStartCloneIndex = i;
					}
					d1 = pathAEnd.getDistance(shape[shapeA].children[i].firstSegment.point);
					d2 = pathAEnd.getDistance(shape[shapeA].children[i].lastSegment.point);
					if ((d1<0.1 || d2<0.1) && !isNaN(i)) {
						pathAEndCloneIndex = i;
					}
				}
			}
			for (i in shape[shapeB].children) {
				if (i!=pathB && shape[shapeB].children[i].className=='Path') {
					var d1 = pathBStart.getDistance(shape[shapeB].children[i].firstSegment.point);
					var d2 = pathBStart.getDistance(shape[shapeB].children[i].lastSegment.point);
					if ((d1<0.1 || d2<0.1) && !isNaN(i)) {
						pathBStartCloneIndex = i;
					}
					d1 = pathBEnd.getDistance(shape[shapeB].children[i].firstSegment.point);
					d2 = pathBEnd.getDistance(shape[shapeB].children[i].lastSegment.point);
					if ((d1<0.1 || d2<0.1) && !isNaN(i)) {
						pathBEndCloneIndex = i;
					}
				}
			}
			var pathAStartPt = pathAStart;
			var pathAEndPt = pathAEnd;
			var pathBStartPt = pathBStart;
			var pathBEndPt = pathBEnd;
			if (pathAEndCloneIndex!=-1) {
				var pt1 = pathAStart.add(normA.multiply(-descend*joints[index]['dirM']));
				var pt2 = pathAEnd.add(normA.multiply(-descend*joints[index]['dirM']));
				var pt3 = pathAStart.add(dirA.multiply(pt1.getDistance(pt2)*10));
				var intPath = new Path.Line(pt1, pt3);
				var xPtList;
				xPtList = intPath.getIntersections(shape[shapeA].children[pathAEndCloneIndex]);
				var xPt = xPtList.length>0 ? xPtList[0].point : null;
				if (xPt != null && intAngle>Math.PI && fingerCount%2==0) {
					pathAEndPt = new Point(xPt.x, xPt.y);
				}
				intPath.remove();
			}
			if (pathBStartCloneIndex!=-1) {
				var pt1 = pathBStart.add(normB.multiply(-descend*joints[index]['dirF']));
				var pt2 = pathBEnd.add(normB.multiply(-descend*joints[index]['dirF']));
				var pt3 = pathBEnd.add(dirB.multiply(pt1.getDistance(pt2)*-10));
				var intPath = new Path.Line(pt2, pt3);
				var xPtList;
				xPtList = intPath.getIntersections(shape[shapeB].children[pathBStartCloneIndex]);
				var xPt = xPtList.length>0 ? xPtList[0].point : null;
				if (xPt != null && intAngle>Math.PI) {
					pathBStartPt = new Point(xPt.x, xPt.y);
				}
				intPath.remove();
			}
			if (pathBEndCloneIndex!=-1) {
				var pt1 = pathBStart.add(normB.multiply(-descend*joints[index]['dirF']));
				var pt2 = pathBEnd.add(normB.multiply(-descend*joints[index]['dirF']));
				var pt3 = pathBStart.add(dirB.multiply(pt1.getDistance(pt2)*10));
				var intPath = new Path.Line(pt1, pt3);
				var xPtList;
				xPtList = intPath.getIntersections(shape[shapeB].children[pathBEndCloneIndex]);
				var xPt = xPtList.length>0 ? xPtList[0].point : null;
				if (xPt != null && intAngle>Math.PI && fingerCount%2==1) {
					pathBEndPt = new Point(xPt.x, xPt.y);
				}
				intPath.remove();
			}
			var radiusArray = [ascend, param['finger width']/2];
			radiusArray.sort(function (a, b) {
				return a-b;
			});
			var fillet = param['finger radius']>radiusArray[0] ? radiusArray[0] : param['finger radius'];
			var ptListA = [pathAStart, pathAStartPt];
			var ptListB = [pathBStart, pathBStartPt];
			var filletListA = [0];
			var filletListB = [0];
			for (var i=0; i<fingerCount; i++) {
				if (i%2==0) {
					var ptA1 = pathAStart.add(dirA.multiply(gap*i+param['tolerance']/2));
					var ptA2 = ptA1.add(normA.multiply(ascend*joints[index]['dirM']));
					var ptA3 = ptA2.add(dirA.multiply(gap-param['tolerance']));
					var ptA4 = ptA1.add(dirA.multiply(gap-param['tolerance']));
					var ptB1 = pathBStart.add(dirB.multiply(gap*i-param['tolerance']/2)).add(normB.multiply(-descend*joints[index]['dirF']));
					var ptB2 = ptB1.add(dirB.multiply(gap+param['tolerance']));
					ptListA.push(ptA1, ptA2, ptA3, ptA4);
					ptListB.push(ptB1, ptB2);
					filletListA.push(0, fillet, fillet, 0);
					filletListB.push(0, 0);
				} else {
					var ptB1 = pathBStart.add(dirB.multiply(gap*i+param['tolerance']/2));
					var ptB2 = ptB1.add(normB.multiply(ascend*joints[index]['dirF']));
					var ptB3 = ptB2.add(dirB.multiply(gap-param['tolerance']));
					var ptB4 = ptB1.add(dirB.multiply(gap-param['tolerance']));
					var ptA1 = pathAStart.add(dirA.multiply(gap*i-param['tolerance']/2)).add(normA.multiply(-descend*joints[index]['dirM']));
					var ptA2 = ptA1.add(dirA.multiply(gap+param['tolerance']));
					ptListB.push(ptB1, ptB2, ptB3, ptB4);
					ptListA.push(ptA1, ptA2);
					filletListB.push(0, fillet, fillet, 0);
					filletListA.push(0, 0);
				}
			}
			ptListA.push(pathAEndPt, pathAEnd);
			ptListB.push(pathBEndPt, pathBEnd);
			filletListA.push(0);
			filletListB.push(0);
			returnA.push(generateFilletPath(ptListA, filletListA));
			returnB.push(generateFilletPath(ptListB, filletListB));
			
			return {'returnA':returnA, 'returnB':returnB};
		}
	}
}

function generateFlapJoint(index, shapeA, pathA, shapeB, pathB, param) {
	var returnA = [];
	var returnB = [];
	var returnBFold = [];
	var returnAFold = [];
	var generateBool = true;
	if (shape[shapeA].children[pathA].segments.length==2 && shape[shapeB].children[pathB].segments.length==2) {
		for (i in shape[shapeA].children[pathA].segments) {
			if (shape[shapeA].children[pathA].segments[i].hasHandles()) {
				generateBool = false;
			}
		}
		for (i in shape[shapeB].children[pathB].segments) {
			if (shape[shapeB].children[pathB].segments[i].hasHandles()) {
				generateBool = false;
			}
		}
	} else {
		setMessage('<b>Paths have more than two points</b> Joint generated based on the start and end points.', '#F80');
	}
	if (!generateBool) {
		setMessage('<b>Paths are not straight</b> Joint generated based on the start and end points.', '#F80');
	} 
	var pathAStart = shape[shapeA].children[pathA].firstSegment.point;
	var pathAEnd = shape[shapeA].children[pathA].lastSegment.point;
	var pathBStart = shape[shapeB].children[pathB].firstSegment.point;
	var pathBEnd = shape[shapeB].children[pathB].lastSegment.point;
	var tanA = pathAEnd.subtract(pathAStart).normalize();
	var tanB = pathBEnd.subtract(pathBStart).normalize();
	var normA = new Point(tanA.y, -tanA.x);
	var normB = new Point(tanB.y, -tanB.x);
	normA = normA.multiply(joints[index]['dirM']);
	normB = normB.multiply(joints[index]['dirF']);
	if (param['height (M)'] > 0) {
		var pt1 = pathAStart;
		var pt2 = pt1.add(normA.multiply(param['height (M)'])).add(tanA.multiply(param['height (M)']/Math.tan(param['flap angle']/180*Math.PI)));
		var pt4 = pathAEnd;
		var pt3 = pt4.add(normA.multiply(param['height (M)'])).add(tanA.multiply(-param['height (M)']/Math.tan(param['flap angle']/180*Math.PI)));
		var fil = calFillet(param['height (M)']*0.75, param['flap angle']);
		returnA.push(generateFilletPath([pt1, pt2, pt3, pt4], [fil, fil]));
		returnAFold.push(new Path.Line(pathAStart, pathAEnd));
		if (param['hole diameter'] > 0) {
			var len = pathAStart.getDistance(pathAEnd);
			var holeCount = Math.floor(len/param['hole spacing']);
			var gapLen = len/holeCount;
			for (var i=0; i<holeCount; i++) {
				var ptA = (pathAStart.add(tanA.multiply(gapLen/2+i*gapLen))).add(normA.multiply(param['height (M)']/2));
				var ptB = (pathBStart.add(tanB.multiply(gapLen/2+i*gapLen))).add(normB.multiply(-param['height (M)']/2));
				returnA.push(new Path.Circle(ptA, param['hole diameter']/2));
				returnB.push(new Path.Circle(ptB, param['hole diameter']/2));
			}
		}
	} else {
		returnA.push(new Path.Line(pathAStart, pathAEnd));
	}
	if (param['height (F)'] > 0) {
		var pt1 = pathBStart;
		var pt2 = pt1.add(normB.multiply(param['height (F)'])).add(tanB.multiply(param['height (F)']/Math.tan(param['flap angle']/180*Math.PI)));
		var pt4 = pathBEnd;
		var pt3 = pt4.add(normB.multiply(param['height (F)'])).add(tanB.multiply(-param['height (F)']/Math.tan(param['flap angle']/180*Math.PI)));
		var fil = calFillet(param['height (F)']*0.75, param['flap angle']);
		returnB.push(generateFilletPath([pt1, pt2, pt3, pt4], [fil, fil]));
		returnBFold.push(new Path.Line(pathBStart, pathBEnd));
		if (param['hole diameter'] > 0) {
			var len = pathBStart.getDistance(pathBEnd);
			var holeCount = Math.floor(len/param['hole spacing']);
			var gapLen = len/holeCount;
			for (var i=0; i<holeCount; i++) {
				var ptA = (pathAStart.add(tanA.multiply(gapLen/2+i*gapLen))).add(normA.multiply(-param['height (F)']/2));
				var ptB = (pathBStart.add(tanB.multiply(gapLen/2+i*gapLen))).add(normB.multiply(param['height (F)']/2));
				returnA.push(new Path.Circle(ptA, param['hole diameter']/2));
				returnB.push(new Path.Circle(ptB, param['hole diameter']/2));
			}
		}
	} else {
		returnB.push(new Path.Line(pathBStart, pathBEnd));	
	}

	return {'returnA':returnA, 'returnB':returnB, 'returnAFold':returnAFold, 'returnBFold':returnBFold};
}

function calFillet(rightAngleHeight, angle) {
	if (angle > 90) {
		var val = rightAngleHeight/(1+Math.sin((angle-90)/180*Math.PI));
		return val;
	} else if (angle < 90) {
		var val = rightAngleHeight/(1-Math.sin((90-angle)/180*Math.PI));
		return val;
	} else {
		return rightAngleHeight;
	}
}

function generateInterlockingJoint(index, shapeA, pathA, shapeB, pathB, param) {
	var returnB = [];
	var returnA = [];
	var returnBFold = [];
	var returnAFold = [];
	
	shape[shapeA].children[pathA+'_joint'].addChild(shape[shapeA].children[pathA].clone());
	shape[shapeB].children[pathB+'_joint'].addChild(shape[shapeB].children[pathB].clone());
	var edgeA = shape[shapeA].children[pathA+'_joint'].children[0];
	var edgeB = shape[shapeB].children[pathB+'_joint'].children[0];
	
	var aEnd = param['offset end']==0 ? edgeA.length-0.001 : edgeA.length-param['offset end'];
	var aStart = param['offset start']==0 ? 0.001 : param['offset start'];
	var bEnd = param['offset end']==0 ? edgeB.length-0.001 : edgeB.length-param['offset end'];
	var bStart = param['offset start']==0 ? 0.001 : param['offset start'];
	var edgeAEnd = edgeA.split(aEnd);
	var edgeAMid = edgeA.split(aStart);
	var edgeBEnd = edgeB.split(bEnd);
	var edgeBMid = edgeB.split(bStart);
	
	var jW = param['interlocking width'];
	var jointCount = Math.floor(edgeAMid.length/jW);
	jointCount = jointCount + jointCount%2;
	var edgeSegmentA = dividePath(edgeAMid, jointCount);
	var edgeSegmentB = dividePath(edgeBMid, jointCount);
	shape[shapeA].children[pathA+'_joint'].removeChildren();
	shape[shapeB].children[pathB+'_joint'].removeChildren();
	
	var intersectPath;
	
	if (edgeA.length>0) {
		returnA.push(edgeA);
	}
	if (edgeAEnd.length>0) {
		returnA.push(edgeAEnd);
	}
	if (edgeB.length>0) {
		returnB.push(edgeB);
	}
	if (edgeBEnd.length>0) {
		returnB.push(edgeBEnd);
	}
	
	for (i in edgeSegmentA) {

		var chordA = new Path([edgeSegmentA[i].firstSegment.point, edgeSegmentA[i].lastSegment.point]);
		var chordB = new Path([edgeSegmentB[i].firstSegment.point, edgeSegmentB[i].lastSegment.point]);
		
		var dirA = chordA.getNormalAt(chordA.length/2).multiply(joints[index]['dirM']);
		var dirB = chordB.getNormalAt(chordB.length/2).multiply(joints[index]['dirF']);
		var tanA = new Point(dirA.y, -dirA.x);
		var tanB = new Point(dirB.y, -dirB.x);
		tanA = tanA.multiply(joints[index]['dirM']);
		tanB = tanB.multiply(joints[index]['dirF']);
		
		if (i%2==0) {
			var pt1 = edgeSegmentA[i].firstSegment.point;
			var pt2 = pt1.add(tanA.multiply(-param['tolerance']));
			var pt3 = pt2.add(dirA.multiply(param['material thickness (F)']));
			var pt4 = pt3.add(tanA.multiply(param['grip']+param['tolerance']));
			var pt5 = pt4.add(dirA.multiply(param['interlocking height'])).add(tanA.multiply(-param['interlocking height']/Math.tan(param['flap angle']/180*Math.PI)));
			var pt10 = edgeSegmentA[i].lastSegment.point;
			var pt9 = pt10.add(tanA.multiply(param['tolerance']));
			var pt8 = pt9.add(dirA.multiply(param['material thickness (F)']));
			var pt7 = pt8.add(tanA.multiply(-param['grip']-param['tolerance']));
			var pt6 = pt7.add(dirA.multiply(param['interlocking height'])).add(tanA.multiply(param['interlocking height']/Math.tan(param['flap angle']/180*Math.PI)));
			var pt6a = pt10.add(dirA.multiply(param['interlocking height']+param['material thickness (F)'])).add(tanA.multiply(param['interlocking height']/Math.tan(param['flap angle']/180*Math.PI)));
			var topFillet = param['interlocking width']>param['interlocking height'] ? calFillet(param['interlocking height']*0.5, param['flap angle']) : calFillet(param['interlocking width']*0.5, param['flap angle']);
			var cornerFillet = param['grip']*2 >= param['interlocking height'] ? calFillet(param['interlocking height']*0.3, 180-param['flap angle']) : calFillet(param['grip']*0.5, 180-param['flap angle']);
			var innerFillet = Math.abs(param['tolerance']) <= param['material thickness (F)'] ? Math.abs(param['tolerance'])/3 : param['material thickness (F)']/3;
			if (i==0) {
				returnA.push(generateFilletPath([pt1, pt2, pt3, pt4, pt5, pt6a, pt10], [innerFillet, innerFillet, cornerFillet, topFillet, topFillet]));
				returnAFold.push(edgeSegmentA[i]);
				returnB.push(edgeSegmentB[i]);
			} else {
				returnA.push(generateFilletPath([pt1, pt2, pt3, pt4, pt5, pt6, pt7, pt8, pt9, pt10], [innerFillet, innerFillet, cornerFillet, topFillet, topFillet, cornerFillet, innerFillet, innerFillet]));
				returnAFold.push(edgeSegmentA[i]);
				returnB.push(edgeSegmentB[i]);
			}		
		} else {
			var pt1 = edgeSegmentB[i].firstSegment.point;
			var pt2 = pt1.add(tanB.multiply(-param['tolerance']));
			var pt3 = pt2.add(dirB.multiply(param['material thickness (M)']));
			var pt4 = pt3.add(tanB.multiply(param['grip']+param['tolerance']));
			var pt5 = pt4.add(dirB.multiply(param['interlocking height'])).add(tanB.multiply(-param['interlocking height']/Math.tan(param['flap angle']/180*Math.PI)));
			var pt5a = pt1.add(dirB.multiply(param['interlocking height']+param['material thickness (M)'])).add(tanB.multiply(-param['interlocking height']/Math.tan(param['flap angle']/180*Math.PI)));
			var pt10 = edgeSegmentB[i].lastSegment.point;
			var pt9 = pt10.add(tanB.multiply(param['tolerance']));
			var pt8 = pt9.add(dirB.multiply(param['material thickness (M)']));
			var pt7 = pt8.add(tanB.multiply(-param['grip']-param['tolerance']));
			var pt6 = pt7.add(dirB.multiply(param['interlocking height'])).add(tanB.multiply(param['interlocking height']/Math.tan(param['flap angle']/180*Math.PI)));
			var topFillet = param['interlocking width']>param['interlocking height'] ? calFillet(param['interlocking height']*0.5, param['flap angle']) : calFillet(param['interlocking width']*0.5, param['flap angle']);
			var cornerFillet = param['grip']*2 >= param['interlocking height'] ? calFillet(param['interlocking height']*0.3, 180-param['flap angle']) : calFillet(param['grip']*0.5, 180-param['flap angle']);
			var innerFillet = Math.abs(param['tolerance']) <= param['material thickness (F)'] ? Math.abs(param['tolerance'])/3 : param['material thickness (F)']/3;
			if (i==(edgeSegmentA.length-1)) {
				returnB.push(generateFilletPath([pt1, pt5a, pt6, pt7, pt8, pt9, pt10], [topFillet, topFillet, cornerFillet, innerFillet, innerFillet]));
				returnBFold.push(edgeSegmentB[i]);
				returnA.push(edgeSegmentA[i]);	
			} else {
				returnB.push(generateFilletPath([pt1, pt2, pt3, pt4, pt5, pt6, pt7, pt8, pt9, pt10], [innerFillet, innerFillet, cornerFillet, topFillet, topFillet, cornerFillet, innerFillet, innerFillet]));
				returnBFold.push(edgeSegmentB[i]);
				returnA.push(edgeSegmentA[i]);
			}
		}
		
		chordA.remove();
		chordB.remove();
	}
	return {'returnA':returnA, 'returnB':returnB, 'returnAFold':returnAFold, 'returnBFold':returnBFold};
}

function generateTabInsertJoint(index, shapeA, pathA, shapeB, pathB, param) {
	var returnA = [];
	var returnB = [];
	var returnAFold = [];
	var returnBFold = [];
	var generateBool = true;
	if (shape[shapeA].children[pathA].segments.length==2 && shape[shapeB].children[pathB].segments.length==2) {
		for (i in shape[shapeA].children[pathA].segments) {
			if (shape[shapeA].children[pathA].segments[i].hasHandles()) {
				generateBool = false;
			}
		}
		for (i in shape[shapeB].children[pathB].segments) {
			if (shape[shapeB].children[pathB].segments[i].hasHandles()) {
				generateBool = false;
			}
		}
	} else {
		setMessage('<b>Paths have more than two points</b> Joint generated based on the start and end points.', '#F80');
	}
	if (!generateBool) {
		setMessage('<b>Paths are not straight</b> Joint generated based on the start and end points.', '#F80');
	} 
	var lineA = new Path.Line(shape[shapeA].children[pathA].firstSegment.point, shape[shapeA].children[pathA].lastSegment.point);
	var lineB = new Path.Line(shape[shapeB].children[pathB].firstSegment.point, shape[shapeB].children[pathB].lastSegment.point);
	var ptAStart, ptAEnd, ptBStart, ptBEnd;
	if (param['offset start'] > 0) {
		ptAStart = lineA.getPointAt(param['offset start']);
		ptBStart = lineB.getPointAt(param['offset start']);
	} else {
		ptAStart = shape[shapeA].children[pathA].firstSegment.point;
		ptBStart = shape[shapeB].children[pathB].firstSegment.point;
	}
	if (param['offset end'] > 0) {
		ptAEnd = lineA.getPointAt(lineA.length-param['offset end']);
		ptBEnd = lineB.getPointAt(lineB.length-param['offset end']);
	} else {
		ptAEnd = shape[shapeA].children[pathA].lastSegment.point;
		ptBEnd = shape[shapeB].children[pathB].lastSegment.point;
	}
	var dirA = ptAEnd.subtract(ptAStart).normalize();
	var dirB = ptBEnd.subtract(ptBStart).normalize();
	var normA = new Point(dirA.y, -dirA.x);
	var normB = new Point(dirB.y, -dirB.x);
	normA = normA.multiply(joints[index]['dirM']);
	normB = normB.multiply(joints[index]['dirF']);
	var pathLength = ptAStart.getDistance(ptAEnd);
	if (Math.floor(pathLength/param['insert width'])==0) {
		setMessage('<b>Paths too short</b> Joint not generated.', '#F80');
		return false;
	} else {
		var insertCount = Math.floor(pathLength/(param['insert width']+param['joint spacing']))+1;
		var insertStart, insertEnd;
		var gap = (pathLength-insertCount*param['insert width'])/(insertCount-1);
		var flapFoldStart = lineB.firstSegment.point;
		for (var i=0; i<insertCount; i++) {
			var pathOffsetStart;
			var pathOffsetEnd;
			if (insertCount==1) {
				pathOffsetStart = pathLength/2-param['insert width']/2;
				pathOffsetEnd = pathLength/2+param['insert width']/2;
			} else {
				pathOffsetStart = i*gap+i*param['insert width'];
				pathOffsetEnd = i*gap+(i+1)*param['insert width'];
			}
			var insertPt1 = ptAStart.add(dirA.multiply(pathOffsetStart));
			var insertPt8 = ptAStart.add(dirA.multiply(pathOffsetEnd));
			var flapPt1 = ptBStart.add(dirB.multiply(pathOffsetStart));
			var flapPt8 = ptBStart.add(dirB.multiply(pathOffsetEnd));
			if (i==0) {
				insertStart = insertPt1;
			}
			if (i==insertCount-1) {
				insertEnd = insertPt8;
			}
			var insertPt2 = insertPt1.add(normA.multiply(param['material thickness (F)']));
			var insertPt3 = insertPt2.add(dirA.multiply(-param['grip']));
			var insertPt4 = insertPt2.add(normA.multiply(param['insert height'])).add(dirA.multiply(param['insert width']/16));
			var insertPt7 = insertPt8.add(normA.multiply(param['material thickness (F)']));
			var insertPt6 = insertPt7.add(dirA.multiply(param['grip']));
			var insertPt5 = insertPt7.add(normA.multiply(param['insert height'])).add(dirA.multiply(-param['insert width']/16));
			returnA.push(generateFilletPath([insertPt1, insertPt2, insertPt3, insertPt4, insertPt5, insertPt6, insertPt7, insertPt8], [0, param['grip']/3, param['insert width']/4, param['insert width']/4, param['grip']/3, 0]));
			returnB.push(generateTabSlit(flapPt1, flapPt8, normB.multiply(-1), param['grip'], param['material thickness (M)']));
			returnAFold.push(generateFilletPath([insertPt1, insertPt8], []));
			returnBFold.push(generateFilletPath([flapFoldStart, flapPt1], []));
			flapFoldStart = flapPt8;
		}
		returnBFold.push(generateFilletPath([flapFoldStart, lineB.lastSegment.point], []));
		for (var i=0; i<insertCount-1; i++) {
			var pathOffsetStart = i*gap+(i+1)*param['insert width'];
			var pathOffsetEnd = (i+1)*gap+(i+1)*param['insert width'];
			var insertPt1 = ptAStart.add(dirA.multiply(pathOffsetStart));
			var insertPt8 = ptAStart.add(dirA.multiply(pathOffsetEnd));
			returnA.push(new Path.Line(insertPt1, insertPt8));
		}
		if (insertCount==1) {
			var pathOffsetStart = pathLength/2-param['insert width']/2;
			var pathOffsetEnd = pathLength/2+param['insert width']/2;
			var insertPt1 = ptAStart.add(dirA.multiply(pathOffsetStart));
			var insertPt8 = ptAStart.add(dirA.multiply(pathOffsetEnd));
			//returnA.push(new Path.Line(insertPt1, insertPt8));
		}
		returnA.push(new Path.Line(shape[shapeA].children[pathA].firstSegment.point, insertStart));
		returnA.push(new Path.Line(shape[shapeA].children[pathA].lastSegment.point, insertEnd));
		var flapStart = shape[shapeB].children[pathB].firstSegment.point;
		var flapEnd = shape[shapeB].children[pathB].lastSegment.point;
		var flapStartTip = flapStart.add(normB.multiply(param['flap height'])).add(dirB.multiply(param['flap height']/Math.tan(param['flap angle']/180*Math.PI)));
		var flapEndTip = flapEnd.add(normB.multiply(param['flap height'])).add(dirB.multiply(-param['flap height']/Math.tan(param['flap angle']/180*Math.PI)));
		var fil = calFillet(param['flap height']*0.8, param['flap angle']);
		returnB.push(generateFilletPath([flapStart, flapStartTip, flapEndTip, flapEnd], [fil, fil]));
		lineA.remove();
		lineB.remove();
		return {'returnA':returnA, 'returnB':returnB, 'returnAFold':returnAFold, 'returnBFold':returnBFold};
	}
}

function generateHemJoint(index, shapeA, pathA, shapeB, pathB, param) {
	var returnB = [];
	var returnA = [];
	var returnAFold = [];
	var returnBFold = [];
	
	shape[shapeA].children[pathA+'_joint'].addChild(shape[shapeA].children[pathA].clone());
	shape[shapeB].children[pathB+'_joint'].addChild(shape[shapeB].children[pathB].clone());
	var edgeA = shape[shapeA].children[pathA+'_joint'].children[0];
	var edgeB = shape[shapeB].children[pathB+'_joint'].children[0];

	var pathOffsetA = offsetPath(edgeA, param['hem offset'], joints[index]['dirM']);
	for (i in pathOffsetA) {
		returnA.push(pathOffsetA[i]);
	}
	var pathOffsetB = offsetPath(edgeB, param['hem offset'], joints[index]['dirF']);
	for (i in pathOffsetB) {
		returnB.push(pathOffsetB[i]);
	}
	returnAFold.push(edgeA);
	returnBFold.push(edgeB);
	
	if (param['hole diameter']>0 && param['hole spacing']>0) {
		var holeCount = Math.floor(edgeA.length/param['hole spacing']);
		var gapA = edgeA.length/holeCount;
		var gapB = edgeB.length/holeCount;
		for (var i=0; i<holeCount; i++) {
			var ptA = edgeA.getPointAt(i*gapA+gapA/2);
			var ptB = edgeB.getPointAt(i*gapB+gapB/2);
			returnA.push(new Path.Circle(ptA, param['hole diameter']/2));
			returnB.push(new Path.Circle(ptB, param['hole diameter']/2));
		}
	}

	shape[shapeA].children[pathA+'_joint'].removeChildren();
	shape[shapeB].children[pathB+'_joint'].removeChildren();
	
	return {'returnA':returnA, 'returnB':returnB, 'returnAFold':returnAFold, 'returnBFold':returnBFold};
}

function lineCP(p2, p0, p1) {
	var p10 = {'x':p0.x-p1.x, 'y':p0.y-p1.y};
	var p12 = {'x':p2.x-p1.x, 'y':p2.y-p1.y};
	var t = dotPdt(p12, p10)/dotPdt(p12, p12);
	var CPx = p1.x + t*p12.x;
	var CPy = p1.y + t*p12.y;
	return {'x': CPx, 'y': CPy, 't': t};
}
function dotPdt(ptA, ptB) {
	return ptA.x*ptB.x+ptA.y*ptB.y;
}
function dist2Pt(aX, aY, bX, bY) {
	var d = Math.sqrt(Math.pow(aX-bX, 2)+Math.pow(aY-bY, 2));
	return d;
}

function offsetPath(pathToOffset, offsetDist, offsetDir) {
	var returnPath = [];
	var splitAt = [];
	for (var i=1; i<pathToOffset.segments.length-1; i++) {
		var h1 = {'x': pathToOffset.segments[i].handleIn.x, 'y': pathToOffset.segments[i].handleIn.y};
		var h2 = {'x': pathToOffset.segments[i].handleOut.x, 'y': pathToOffset.segments[i].handleOut.y};
		var d1 = dist2Pt(h1.x, h1.y, 0, 0);
		var d2 = dist2Pt(h2.x, h2.y, 0, 0);
		if (d1==0 || d2==0) {
			splitAt.push(i);
		} else {
			var CP = lineCP(h2, {'x':0, 'y':0}, h1);
			var d = dist2Pt(CP.x, CP.y, 0, 0);
			if (d > 0.1) {
				splitAt.push(i);
			}
		}
	}
	if (splitAt.length > 0) {
		var paths = [];
		var pathsOffset = [];
		paths.push(new Path());
		pathsOffset.push(new Path());
		for (var i=0; i<splitAt.length; i++) {
			paths.push(new Path());
			pathsOffset.push(new Path());
		}
		var counter = 0;
		for (var i=0; i<pathToOffset.segments.length; i++) {
			paths[counter].add(pathToOffset.segments[i]);
			if (splitAt.indexOf(i)>=0) {
				counter++;
				paths[counter].add(pathToOffset.segments[i]);
			}
		}
		for (var i=0; i<paths.length; i++) {
			var amount = Math.floor(paths[i].length/10);
			amount = amount<3 ? 3 : amount;
			for (var j=0; j<amount+1; j++) {
				var pt = paths[i].getPointAt(j/amount*paths[i].length);
				var normal = paths[i].getNormalAt(j/amount*paths[i].length).multiply(offsetDir);
				var pt2 = pt.add(normal.multiply(offsetDist));
				pathsOffset[i].add(pt2);
			}
			pathsOffset[i].smooth();
		}
		var intersections = [];
		for (var i=0; i<paths.length-1; i++) {
			var pts = pathsOffset[i].getIntersections(pathsOffset[i+1]);
			if (pts.length>0) {
				if (pts.length==1) {
					var d = dist2Pt(pathsOffset[i].lastSegment.point.x, pathsOffset[i].lastSegment.point.y, pts[0].point.x, pts[0].point.y);
					if (d==0) {
						intersections.push("none");
					} else {
						intersections.push(pts[0].point);
					}
				} else {
					intersections.push(pts[0].point);
				}
			} else {
				intersections.push("none");
			}
		}
		for (var i=0; i<pathsOffset.length; i++) {
			if (i==0 && intersections[i]!="none") {
				var splitPath = pathsOffset[i].split(pathsOffset[i].getNearestLocation(intersections[i]));
				splitPath.remove();
			} else if (i>0 && i<pathsOffset.length-1) {
				if (intersections[i-1]!="none") {
					var splitPath = pathsOffset[i].split(pathsOffset[i].getNearestLocation(intersections[i-1]));
					pathsOffset[i].remove();
					pathsOffset[i] = splitPath.clone();
					splitPath.remove();
				}
				if (intersections[i]!="none") {
					var splitPath = pathsOffset[i].split(pathsOffset[i].getNearestLocation(intersections[i]));
					splitPath.remove();
				}
			} else if (i==pathsOffset.length-1 && intersections[i-1]!="none") {
				var splitPath = pathsOffset[i].split(pathsOffset[i].getNearestLocation(intersections[i-1]));
				pathsOffset[i].remove();
				pathsOffset[i] = splitPath.clone();
				splitPath.remove();
			}
		}
		for (var i=0; i<intersections.length; i++) {
			if (intersections[i]=="none") {
				var ptA = pathsOffset[i].lastSegment.point;
				var tanA = pathsOffset[i].getTangentAt(pathsOffset[i].length);
				var ptB = pathsOffset[i+1].firstSegment.point;
				var tanB = pathsOffset[i+1].getTangentAt(0);
				var pt = lineIntersection(ptA, ptA.add(tanA), ptB, ptB.add(tanB.multiply(-1)));
				pathsOffset[i].quadraticCurveTo(new Point(pt.x, pt.y), new Point(ptB.x, ptB.y));
			}
		}
		for (var i=1; i<pathsOffset.length; i++) {
			var len = pathsOffset[0].segments.length;
			pathsOffset[0].segments[len-1].handleOut = pathsOffset[i].segments[0].handleOut;
			for (var j=1; j<pathsOffset[i].segments.length; j++) {
				pathsOffset[0].add(pathsOffset[i].segments[j]);
			}
		}
		pathsOffset[0].insert(0, pathToOffset.firstSegment.point);
		pathsOffset[0].insert(pathsOffset[0].segments.length, pathToOffset.lastSegment.point);
		var finalPath = pathsOffset[0].clone();
		for (i in paths) {
			paths[i].remove();
		}
		for (i in pathsOffset) {
			pathsOffset[i].remove();
		}
		returnPath.push(finalPath);
		return returnPath;
	} else {
		var pathsOffset = new Path();
		var amount = Math.floor(pathToOffset.length/10);
		amount = amount<3 ? 3 : amount;
		for (var j=0; j<amount+1; j++) {
			var pt = pathToOffset.getPointAt(j/amount*pathToOffset.length);
			var normal = pathToOffset.getNormalAt(j/amount*pathToOffset.length).multiply(offsetDir);
			var pt2 = pt.add(normal.multiply(offsetDist));
			pathsOffset.add(pt2);
		}
		pathsOffset.smooth();
		pathsOffset.insert(0, pathToOffset.firstSegment.point);
		pathsOffset.insert(pathsOffset.segments.length, pathToOffset.lastSegment.point);
		var finalPath = pathsOffset.clone();
		pathsOffset.remove();
		returnPath.push(finalPath);
		return returnPath;
	}
}

function generateFingerJoint(index, shapeA, pathA, shapeB, pathB, param) {
	var returnA = [];
	var returnB = [];
	var generateBool = true;
	if (shape[shapeA].children[pathA].segments.length==2 && shape[shapeB].children[pathB].segments.length==2) {
		for (i in shape[shapeA].children[pathA].segments) {
			if (shape[shapeA].children[pathA].segments[i].hasHandles()) {
				generateBool = false;
			}
		}
		for (i in shape[shapeB].children[pathB].segments) {
			if (shape[shapeB].children[pathB].segments[i].hasHandles()) {
				generateBool = false;
			}
		}
	} else {
		setMessage('<b>Paths have more than two points</b> Joint generated based on the start and end points.', '#F80');
	}
	if (!generateBool) {
		setMessage('<b>Paths are not straight</b> Joint generated based on the start and end points.', '#F80');
	}
	var lineA = new Path.Line(shape[shapeA].children[pathA].firstSegment.point, shape[shapeA].children[pathA].lastSegment.point);
	var lineB = new Path.Line(shape[shapeB].children[pathB].firstSegment.point, shape[shapeB].children[pathB].lastSegment.point);
	var ptAStart, ptAEnd, ptBStart, ptBEnd;
	if (param['offset start'] > 0) {
		ptAStart = lineA.getPointAt(param['offset start']);
		ptBStart = lineB.getPointAt(param['offset start']);
		//returnA.push(new Path.Line(shape[shapeA].children[pathA].firstSegment.point, ptAStart));
		//returnB.push(new Path.Line(shape[shapeB].children[pathB].firstSegment.point, ptBStart));
	} else {
		ptAStart = shape[shapeA].children[pathA].firstSegment.point;
		ptBStart = shape[shapeB].children[pathB].firstSegment.point;
	}
	if (param['offset end'] > 0) {
		ptAEnd = lineA.getPointAt(lineA.length-param['offset end']);
		ptBEnd = lineB.getPointAt(lineB.length-param['offset end']);
		//returnA.push(new Path.Line(shape[shapeA].children[pathA].lastSegment.point, ptAEnd));
		//returnB.push(new Path.Line(shape[shapeB].children[pathB].lastSegment.point, ptBEnd));
	} else {
		ptAEnd = shape[shapeA].children[pathA].lastSegment.point;
		ptBEnd = shape[shapeB].children[pathB].lastSegment.point;
	}
	var dirA = ptAEnd.subtract(ptAStart).normalize();
	var dirB = ptBEnd.subtract(ptBStart).normalize();
	var normA = new Point(dirA.y, -dirA.x);
	var normB = new Point(dirB.y, -dirB.x);
	var fingerCount = Math.floor(ptAStart.getDistance(ptAEnd)/(param['finger width']*2))*2;
	var gap = ptAStart.getDistance(ptAEnd)/fingerCount;
	var ptListA = [shape[shapeA].children[pathA].firstSegment.point];
	var ptListB = [shape[shapeB].children[pathB].firstSegment.point];
	var radiusArray = [param['material thickness (F)'], param['material thickness (M)'], param['finger width']/2];
	radiusArray.sort(function (a, b) {
		return a-b;
	});
	var fillet = param['finger radius']>radiusArray[0] ? radiusArray[0] : param['finger radius'];
	var filletArrayA = [];
	var filletArrayB = [];
	for (var i=0; i<fingerCount; i++) {
		if (i%2==0) {
			var ptA1 = ptAStart.add(dirA.multiply(i*gap));
			var ptA2 = ptA1.add(dirA.multiply(param['tolerance']/2));
			var ptA3 = ptA2.add(normA.multiply(param['material thickness (F)']*joints[index]['dirM']));
			var ptA6 = ptA1.add(dirA.multiply(gap));
			var ptA5 = ptA6.add(dirA.multiply(-param['tolerance']/2));
			var ptA4 = ptA5.add(normA.multiply(param['material thickness (F)']*joints[index]['dirM']));
			ptListA.push(ptA1, ptA2, ptA3, ptA4, ptA5, ptA6);
			filletArrayA.push(0, 0, fillet, fillet, 0, 0);
			
			var ptB1 = ptBStart.add(dirB.multiply(i*gap));
			var ptB2 = ptB1.add(dirB.multiply(gap));
			ptListB.push(ptB1, ptB2);
			filletArrayB.push(0, 0);
		} else {
			var ptB1 = ptBStart.add(dirB.multiply(i*gap));
			var ptB2 = ptB1.add(dirB.multiply(param['tolerance']/2));
			var ptB3 = ptB2.add(normB.multiply(param['material thickness (M)']*joints[index]['dirF']));
			var ptB6 = ptB1.add(dirB.multiply(gap));
			var ptB5 = ptB6.add(dirB.multiply(-param['tolerance']/2));
			var ptB4 = ptB5.add(normB.multiply(param['material thickness (M)']*joints[index]['dirF']));
			ptListB.push(ptB1, ptB2, ptB3, ptB4, ptB5, ptB6);
			filletArrayB.push(0, 0, fillet, fillet, 0, 0);
			
			var ptA1 = ptAStart.add(dirA.multiply(i*gap));
			var ptA2 = ptA1.add(dirA.multiply(gap));
			ptListA.push(ptA1, ptA2);
			filletArrayA.push(0, 0);
		}
	}
	ptListA.push(shape[shapeA].children[pathA].lastSegment.point);
	ptListB.push(shape[shapeB].children[pathB].lastSegment.point);
	
	returnA.push(generateFilletPath(ptListA, filletArrayA));
	returnB.push(generateFilletPath(ptListB, filletArrayB));
	
	lineA.remove();
	lineB.remove();
	
	return {'returnA':returnA, 'returnB':returnB};
}

function generateLoopInsert(index, shapeA, pathA, shapeB, pathB, param, softBool, surfBool, hookCount) {
	var returnB = [];
	var returnA = [];
	var returnAFold = [];
	var returnBFold = [];
	var generateBool = true;
	if (surfBool) {
		if (shape[shapeA].children[pathA].segments.length==2 && shape[shapeB].children[pathB].segments.length==2) {
			for (i in shape[shapeA].children[pathA].segments) {
				if (shape[shapeA].children[pathA].segments[i].hasHandles()) {
					generateBool = false;
				}
			}
			for (i in shape[shapeB].children[pathB].segments) {
				if (shape[shapeB].children[pathB].segments[i].hasHandles()) {
					generateBool = false;
				}
			}
		} else {
			setMessage('<b>Paths have more than two points</b> Joint generated based on the start and end points.', '#F80');
		}
	}
	
	if (!generateBool) {
		setMessage('<b>Paths are not straight</b> Joint generated based on the start and end points.', '#F80');
	}
	shape[shapeA].children[pathA+'_joint'].addChild(shape[shapeA].children[pathA].clone());
	shape[shapeB].children[pathB+'_joint'].addChild(shape[shapeB].children[pathB].clone());
	var edgeA = shape[shapeA].children[pathA+'_joint'].children[0];
	var edgeB = shape[shapeB].children[pathB+'_joint'].children[0];
	
	var aEnd = param['offset end']==0 ? edgeA.length-0.001 : edgeA.length-param['offset end'];
	var aStart = param['offset start']==0 ? 0.001 : param['offset start'];
	var bEnd = param['offset end']==0 ? edgeB.length-0.001 : edgeB.length-param['offset end'];
	var bStart = param['offset start']==0 ? 0.001 : param['offset start'];
	var edgeAEnd = edgeA.split(aEnd);
	var edgeAMid = edgeA.split(aStart);
	var edgeBEnd = edgeB.split(bEnd);
	var edgeBMid = edgeB.split(bStart);
	
	var jW = param['insert width']+param['joint spacing']*2;
	var jointCount = Math.floor(edgeAMid.length/jW);
	var edgeSegmentA = dividePath(edgeAMid, jointCount);
	var edgeSegmentB = dividePath(edgeBMid, jointCount);
	var edgeB2 = shape[shapeB].children[pathB].clone();
	if (softBool && !surfBool) {
		var offsetPaths = offsetPath(edgeB2, param['hem offset'], joints[index]['dirF']);
		for (i in offsetPaths) {
			returnB.push(offsetPaths[i]);
		}
		returnBFold.push(edgeB2);

	} else if (!surfBool) {
		returnB.push(edgeB2);
	}
	edgeB2.remove();
	shape[shapeA].children[pathA+'_joint'].removeChildren();
	shape[shapeB].children[pathB+'_joint'].removeChildren();
	
	var intersectPath;
	
	if (edgeA.length>0) {
		returnA.push(edgeA);
	}
	if (edgeAEnd.length>0) {
		returnA.push(edgeAEnd);
	}
	
	for (i in edgeSegmentA) {

		var chordA = new Path([edgeSegmentA[i].firstSegment.point, edgeSegmentA[i].lastSegment.point]);
		var chordB = new Path([edgeSegmentB[i].firstSegment.point, edgeSegmentB[i].lastSegment.point]);
		
		var dirA = chordA.getNormalAt(chordA.length/2).multiply(joints[index]['dirM']);
		var chordAMidPt = chordA.getPointAt(chordA.length/2);
		var chordAJointStart = chordA.getPointAt(chordA.length/2-param['insert width']/2);
		var chordAJointEnd = chordA.getPointAt(chordA.length/2+param['insert width']/2);
		intersectPath = new Path([chordAJointStart.add(dirA.multiply(-100)), chordAJointStart.add(dirA.multiply(100))]);
		var pathAStartLoc = edgeSegmentA[i].getIntersections(intersectPath)[0];
		var pathAStart = pathAStartLoc.point;
		intersectPath.remove();
		intersectPath = new Path([chordAJointEnd.add(dirA.multiply(-100)), chordAJointEnd.add(dirA.multiply(100))]);
		var pathAEndLoc = edgeSegmentA[i].getIntersections(intersectPath)[0];
		var pathAEnd = pathAEndLoc.point;
		intersectPath.remove();
		var dirB = chordB.getNormalAt(chordB.length/2).multiply(joints[index]['dirF']);
		var chordBMidPt = chordB.getPointAt(chordB.length/2);
		var chordBJointStart = chordB.getPointAt(chordB.length/2-param['insert width']/2);
		var chordBJointEnd = chordB.getPointAt(chordB.length/2+param['insert width']/2);
		intersectPath = new Path([chordBJointStart.add(dirB.multiply(-100)), chordBJointStart.add(dirB.multiply(100))]);
		var pathBStartLoc = edgeSegmentB[i].getIntersections(intersectPath)[0];
		var pathBStart = pathBStartLoc.point;
		intersectPath.remove();
		intersectPath = new Path([chordBJointEnd.add(dirB.multiply(-100)), chordBJointEnd.add(dirB.multiply(100))]);
		var pathBEndLoc = edgeSegmentB[i].getIntersections(intersectPath)[0];
		var pathBEnd = pathBEndLoc.point;
		intersectPath.remove();
		var segmentA = edgeSegmentA[i].clone();
		var endSegment = segmentA.split(segmentA.getLocationOf(pathAEnd));
		var midSegment = segmentA.split(segmentA.getLocationOf(pathAStart)); // segmentA left with start segment
		
		var tanA = new Point(dirA.y, -dirA.x);
		tanA = tanA.multiply(joints[index]['dirM']);
		var extension = (chordAJointStart.getDistance(pathAStart)+chordAJointEnd.getDistance(pathAEnd))/2;
		var jointHeight;
		if (softBool || surfBool) {
			jointHeight = param['hem offset']+param['material thickness (F)']+param['material thickness (F)']+param['slack'];
		} else {
			jointHeight = Math.sqrt(Math.pow(param['hem offset'], 2)+Math.pow(param['material thickness (F)'], 2))+param['hem offset']*2+param['material thickness (F)']+param['slack'];
		}
		var ptAS = [];
		var ptAE = [];
		var ptAST = [];
		var ptAET = [];
		var matThick = param['material thickness (M)'];
		if (surfBool) {
			matThick = param['material thickness (F)']+param['material thickness (M)'];
		}
		for (var i=0; i<hookCount; i++) {
			if (i==0) {
				ptAS.push(chordAJointStart.add(dirA.multiply(extension+jointHeight)));
				ptAE.push(chordAJointEnd.add(dirA.multiply(extension+jointHeight)));
				ptAST.push(ptAS[0].add(dirA.multiply(-param['hook width'])).add(tanA.multiply(param['hook width'])));
				ptAET.push(ptAE[0].add(dirA.multiply(-param['hook width'])).add(tanA.multiply(-param['hook width'])));
			} else {
				ptAS.push(ptAS[(i-1)*2].add(dirA.multiply(param['insert width']+matThick)));
				ptAE.push(ptAE[(i-1)*2].add(dirA.multiply(param['insert width']+matThick)));
				ptAST.push(ptAST[(i-1)*2].add(dirA.multiply(param['insert width']+matThick)));
				ptAET.push(ptAET[(i-1)*2].add(dirA.multiply(param['insert width']+matThick)));
			}
			ptAS.push(ptAS[i*2].add(dirA.multiply(param['insert width'])));
			ptAE.push(ptAE[i*2].add(dirA.multiply(param['insert width'])));
			ptAST.push(ptAST[i*2].add(dirA.multiply(param['insert width'])));
			ptAET.push(ptAET[i*2].add(dirA.multiply(param['insert width'])));
		}
		var ptATip = chordAMidPt.add(dirA.multiply(extension+jointHeight+param['insert width']*(hookCount+0.5)+matThick*(hookCount-1)));
		var ptList = [pathAStart];
		var fillet = [];
		for (var i=0; i<ptAS.length; i++) {
			if (i%2==0) {
				ptList.push(ptAS[i]);
				fillet.push(0);
				ptList.push(ptAST[i]);
				fillet.push(param['hook width']/5);
			} else {
				ptList.push(ptAST[i]);
				fillet.push(param['hook width']/3);
				if (i<ptAS.length-1) {
					ptList.push(ptAS[i]);
					fillet.push(0);
				}
			}
		}
		ptList.push(ptATip);
		fillet.push(param['hook width']/1.5);
		for (var i=ptAE.length-1; i>=0; i--) {
			if (i%2==1) {
				if (i<ptAE.length-1) {
					ptList.push(ptAE[i]);
					fillet.push(0);
				}
				ptList.push(ptAET[i]);
				fillet.push(param['hook width']/3);
			} else {
				ptList.push(ptAET[i]);
				fillet.push(param['hook width']/5);
				ptList.push(ptAE[i]);
				fillet.push(0);
			}
			
		}
		ptList.push(pathAEnd);

		var insertPath = generateFilletPath(ptList, fillet);
		returnA.push(insertPath);
		returnA.push(endSegment);
		returnA.push(segmentA);
		
		var slitAS = [chordAJointStart.add(dirA.multiply(-param['hem offset']))];
		var slitAE = [chordAJointEnd.add(dirA.multiply(-param['hem offset']))];
		for (var i=0; i<hookCount-1; i++) {
			slitAS.push(slitAS[i].add(dirA.multiply(-param['insert width'])));
			slitAE.push(slitAE[i].add(dirA.multiply(-param['insert width'])));
		}	
		var slitBS = [];
		var slitBE = [];
		if (softBool && !surfBool) {
			slitBS.push(chordBJointStart);
			slitBE.push(chordBJointEnd);
		} else if ( !surfBool ) {
			slitBS.push(chordBJointStart.add(dirB.multiply(-param['hem offset'])));
			slitBE.push(chordBJointEnd.add(dirB.multiply(-param['hem offset'])));
		} else if (surfBool) {
			slitBS.push(chordBJointStart);
			slitBE.push(chordBJointEnd);
			for (var i=0; i<hookCount; i++) {
				if (i==0) {
					slitBS.push(slitBS[i].add(dirB.multiply(-param['hem offset'])));
					slitBE.push(slitBE[i].add(dirB.multiply(-param['hem offset'])));
				} else {
					slitBS.push(slitBS[i].add(dirB.multiply(-param['insert width'])));
					slitBE.push(slitBE[i].add(dirB.multiply(-param['insert width'])));
				}
			}
		}
		
		
		if (param['material thickness (M)']==0) {
			for (i in slitAS) {
				var AS = new Path([slitAS[i], slitAE[i]]);
				returnA.push(AS);
				returnA.push(new Path.Circle(slitAS[i], 0.25));
				returnA.push(new Path.Circle(slitAE[i], 0.25));
			}
			for (i in slitBS) {
				var BS = new Path([slitBS[i], slitBE[i]]);
				returnB.push(BS);
				returnB.push(new Path.Circle(slitBS[i], 0.25));
				returnB.push(new Path.Circle(slitBE[i], 0.25));
			}					
		} else {
			for (i in slitAS) {
				slitA = generateSlit(slitAS[i], slitAE[i], param['material thickness (M)']);	
				returnA.push(slitA);
			}
			for (i in slitBS) {
				slitB = generateSlit(slitBS[i], slitBE[i], param['material thickness (M)']);	
				returnB.push(slitB);
			}
		}
		chordA.remove();
		chordB.remove();
	}
	return {'returnA':returnA, 'returnB':returnB, 'returnAFold':returnAFold, 'returnBFold':returnBFold};
}


function disconnectedOffsetPath(path, offset, dir) {
	var dOffsetPath = offsetPath(path, offset, dir);

	if (dOffsetPath.length != 1) {
		console.warn("Not n == 1 path created for offsetPath");
	}
	if (dOffsetPath[0].segments.length < 4) {
		console.warn("Offset path with less than 4 segments created");
	}
	dOffsetPath[0].segments.pop();
	dOffsetPath[0].segments.shift();
	var returnPath = new Path(dOffsetPath[0].segments);
	return returnPath;
}


function dividePath(p, n) {
	var path = p;
	var segment = [];
	var gap = p.length/n;
	for (var i=n-1; i>0; i--) {
		var path1 = path.split(i*gap);
		segment.push(path1);
	}
	segment.push(path);
	path.remove();
	return segment;
}

function generateFilletPath(ptList, fillet) {
	var path = new Path();
	path.add(ptList[0]);
	for (var i=1; i<ptList.length-1; i++) {
		if (fillet[i-1]==0) {
			path.add(ptList[i]);
		} else {
			var vec1 = ptList[i-1].subtract(ptList[i]).normalize();
			var vec2 = ptList[i+1].subtract(ptList[i]).normalize();
			var angle = Math.abs(angleBetween(ptList[i-1], ptList[i], ptList[i+1]));
			var d1 = fillet[i-1]/Math.tan(angle/2);
			var d2 = fillet[i-1]/Math.sin(angle/2)-fillet[i-1];
			var arcS = ptList[i].add(vec1.multiply(d1));
			var arcE = ptList[i].add(vec2.multiply(d1));
			var vecMid = vec1.add(vec2).normalize();
			var arcMid = ptList[i].add(vecMid.multiply(d2));
			var arc = new Path.Arc(arcS, arcMid, arcE);
			path.addSegments(arc.segments);
			arc.remove();
		}
	}
	path.add(ptList[ptList.length-1]);
	
	return path;
}

function generatePath(ptList) {
	var path = new Path();
	for (var i=0; i<ptList.length; i++) {
		path.add(ptList[i]);
	}
	
	return path;
}

function generateSlit(start, end, thickness) {
	var tangent = end.subtract(start).normalize();
	var normal = new Point(tangent.y, -tangent.x);
	var start1 = start.add(normal.multiply(thickness/2)).add(tangent.multiply(thickness/2));
	var start2 = start.add(normal.multiply(-thickness/2)).add(tangent.multiply(thickness/2));
	var end1 = end.add(normal.multiply(thickness/2)).add(tangent.multiply(-thickness/2));
	var end2 = end.add(normal.multiply(-thickness/2)).add(tangent.multiply(-thickness/2));
	var slitPath = new Path();
	var arc1 = new Path.Arc(start1, start, start2);
	var arc2 = new Path.Arc(end2, end, end1);
	slitPath.addSegments(arc1.segments);
	slitPath.addSegments(arc2.segments);
	slitPath.addSegment(start1);
	arc1.remove();
	arc2.remove();
	return slitPath;
}

function generateTabSlit(start, end, normal, grip, thickness) {
	var tangent = end.subtract(start).normalize();
	var start1 = start.add(tangent.multiply(-grip*0.7));
	var end1 = end.add(tangent.multiply(grip*0.7));
	var start2 = start.add(normal.multiply(-thickness));
	var end2 = end.add(normal.multiply(-thickness));
	return generateFilletPath([start1, start, start2, end2, end, end1], [thickness*0.0, thickness*0.8, thickness*0.8, thickness*0.0]);
}

function angleVec(BA, CD) { //Angle between BA and CD
	var theta = Math.atan2(BA.x*CD.y-BA.y*CD.x, BA.x*CD.x+BA.y*CD.y);
	return theta;
}

function angleBetween(ptA, ptB, ptC) { //Angle between BA and BC
	var BA = {'x':(ptA.x-ptB.x), 'y':(ptA.y-ptB.y)};
	var BC = {'x':(ptC.x-ptB.x), 'y':(ptC.y-ptB.y)};
	var theta = Math.atan2(BA.x*BC.y-BA.y*BC.x, BA.x*BC.x+BA.y*BC.y);
	return theta;
}

function lineIntersection(line1Start, line1End, line2Start, line2End) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onLine1: false,
        onLine2: false
    };
	
    denominator = ((line2End.y - line2Start.y) * (line1End.x - line1Start.x)) - ((line2End.x - line2Start.x) * (line1End.y - line1Start.y));
    if (denominator == 0) {
        return result;
    }
	
    a = line1Start.y - line2Start.y;
    b = line1Start.x - line2Start.x;
    numerator1 = ((line2End.x - line2Start.x) * a) - ((line2End.y - line2Start.y) * b);
    numerator2 = ((line1End.x - line1Start.x) * a) - ((line1End.y - line1Start.y) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1Start.x + (a * (line1End.x - line1Start.x));
    result.y = line1Start.y + (a * (line1End.y - line1Start.y));

    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) {
        result.onLine1 = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) {
        result.onLine2 = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
};

async function getTemplate(templateName) {
	console.log("🚀 ~ file: joints.js:1751 ~ getTemplate ~ template", template)
	if (template == undefined) {
		
		$.getJSON(templateName, function(data){
			console.log("🚀 ~ file: joints.js:1753 ~ $.getJSON ~ data", data)
			template = data;
			return data;
		}).fail(function(){
			console.error("Failed to load JSON template.");
			return;
		});
	}
	else return template;
}

function aimGCodePart(startPlace, endPlace, patternDefaultLength, gcode) {
	var outGCode = '\n';
	var deltaX = endPlace.x - startPlace.x;
	var deltaY = endPlace.y - startPlace.y;
	const length = Math.sqrt((deltaX*deltaX) + (deltaY*deltaY));
	
	lengthFactor = length / patternDefaultLength;
	console.log({length:length, lengthFactor:lengthFactor});
	var rad = Math.atan2(deltaY, deltaX); // In radians
	// if (Math.abs(rad) > 0.001) {
	if (true) {
		var originP = new Point(0.0, 0.0);
		var lines = gcode.split('\n');
		for (let line of lines) {
			const preCommentLine = line.split(';')[0];
			var remainingPartString = '';
			if (preCommentLine.length > 0) {
				var parts = preCommentLine.split(' ');
				if (parts[0] === 'G0' || parts[0] === 'G1' || parts[0] === 'g0' || parts[0] === 'g1') {
					var skipped1 = false;
					let xLen = 0.0;
					let yLen = 0.0;
					let zLen = 0.0;
					let extrusion = 0.0;
					parts.forEach(function (part) {
						if (part[0] === 'X' || part[0] === 'x') {
							xLen = parseFloat(part.substring(1));
						}
						else if (part[0] === 'Y' || part[0] === 'y') {
							yLen = parseFloat(part.substring(1));
						}
						else if (part[0] === 'Z' || part[0] === 'z') {
							zLen = parseFloat(part.substring(1));
						}
						else if (part[0] === 'E' || part[0] === 'e') {
							extrusion = parseFloat(part.substring(1));
						}

						// remaining parts that need no handling
						else {
							if (skipped1) {
								remainingPartString = remainingPartString + ' ' + part;
							}
							else {
								skipped1 = true;
							}
						}
					});

					var xOut = ((xLen * Math.cos(rad)) - (yLen * Math.sin(rad)))*lengthFactor;
					var yOut = ((xLen * Math.sin(rad)) + (yLen * Math.cos(rad)))*lengthFactor;
					var zOut = zLen;
					var eOut = extrusion*lengthFactor*lengthFactor; // area increases twice with length, so we extrude accordingly

					let outLine = parts[0];
					if (Math.abs(xOut) > 0.0001) outLine += (' X' + xOut.toFixed(3));
					if (Math.abs(yOut) > 0.0001) outLine += (' Y' + yOut.toFixed(3));
					if (Math.abs(zOut) > 0.0001) outLine += (' Z' + zOut.toFixed(3));
					if (Math.abs(eOut) > 0.0001) outLine += (' E' + eOut.toFixed(3)); 
					outLine += remainingPartString;
					outLine += '\n';
					outGCode += outLine;
				}
				else {
					outGCode += line;
					outGCode += '\n';
				}
			}
		}
		return outGCode;
	} else {
		return gcode;
	}
	
}

// Combination of printed needle and thread
function addGCodePartsC(outString, params, placeList, commandObjs, depthAdjustment, reverse=false) {
	// console.log({MSG:"Adding GCode", commandObj:commandObj, depthAdjustment:depthAdjustment, placeList:placeList, params:params});
	// console.log("outString: " + outString.length);

	commandObj = commandObjs[0];
	needleObj = commandObjs[1];
	
	function produceCode(commandObj, place, depthAdjustment, skip=false, onlyAim=false) {
		let addString = "";
		addString += `G1 Z${commandObj.zClearing} F3000\n`; // Safety lift
		addString += `G1 X${(place.x + constXShift + commandObj.offset.x).toFixed(3)} Y${(place.y + depthAdjustment + commandObj.offset.y).toFixed(3)} F7200\n`; // XY positioning
		addString += `G1 Z${commandObj.zStart} F3000\n`; // Z positioning
		
		if (onlyAim) {
			return addString;
		}
		if (skip) {
			addString += commandObj.skipGCode;
		}
		else {
			addString += commandObj.gcode;
		}
		return addString;
	}
	
	var lastPlace = [];
	var patternIndex = 0;
	let placeCounter = 0;
	// for (let i = -5; i < 5; i++) { 
	// 	console.log(mod(i, commandObj.pattern.length));
	// }

	let pattern = [...commandObj.pattern];
	// console.log('pattern: ', pattern);

	let placeListLocal = [...placeList];

	let handledList = [...placeList];

	if (pattern.length == 0) {
		// pattern = [1];
	}
	if (reverse) {
		pattern = pattern.reverse();
		placeListLocal = placeListLocal.reverse();
	}

	for (let place of placeListLocal) {
		place.handled = false;
	}

	for (let place of placeListLocal) {
		// outString += `G1 Z${commandObj.zClearing} F3000\n`; // Safety lift
		// outString += `G1 X${(place.x + constXShift + commandObj.offset.x).toFixed(3)} Y${(place.y + depthAdjustment + commandObj.offset.y).toFixed(3)} F7200\n`; // XY positioning
		// outString += `G1 Z${commandObj.zStart} F3000\n`; // Z positioning
		
		if (commandObj.directional == false) {
			if (pattern[patternIndex] !== 0) {
				// outString += commandObj.gcode; // Adding plug&play/drag&drop G-Code
				outString += produceCode(needleObj, place, depthAdjustment);
				outString += produceCode(commandObj, place, depthAdjustment, false);
			}
		}
		else {
			if (Math.abs(pattern[patternIndex]) == 0) {
				// If following pattern spots would connect to this, but line ends early, add skip-gcode
				for (let i = patternIndex; i < (patternIndex+pattern.length); i++) {  // check whole pattern
					const patternPlace = mod(i, pattern.length);
					if (((placeCounter+i-patternIndex+1) > placeList.length)) { // only parts of the pattern that would come after line ends 
						if ((Math.abs(pattern[patternPlace]) > 0.5)) { // Only if the pattern actually connects to something
							if (mod((i - pattern[patternPlace]), pattern.length) == patternIndex)  { // Check if it connects to the current point
								// outString += commandObj.skipGCode;
								if (place.handled == false) {
									outString += produceCode(needleObj, place, depthAdjustment);
									place.handled = true;
								}
								outString += produceCode(commandObj, place, depthAdjustment, true);
								break;
							}
						}
					}
				}
				// if ((placeCounter+1) == placeList.length) { // edge case, print counter on last hole when hole would normally be skipped
				// 	outString += commandObj.skipGCode;
				// }

			} else if (pattern[patternIndex] == 0.5) {
				if (((placeCounter+pattern.length) > (placeList.length)) || ((placeCounter-pattern.length) < -1)) {
					// outString += commandObj.skipGCode;
					if (place.handled == false) {
						outString += produceCode(needleObj, place, depthAdjustment);
						place.handled = true;
					}
					outString += produceCode(commandObj, place, depthAdjustment, true);
				}

			} else { 
				
				if (pattern[patternIndex] > lastPlace.length) { // No place saved yet, can't connect here, so add skip-gcode
					let noOut = true;
					for (let i = patternIndex; i < (patternIndex+pattern.length); i++) { // check whole pattern
						const patternPlace = mod(i, pattern.length);
						if ((Math.abs(pattern[patternPlace]) > 0.5) && (mod((i - pattern[patternPlace]), pattern.length) == patternIndex)) {
							noOut = false;
						}
					}
					if (noOut)  {
						// outString += commandObj.skipGCode;
						if (place.handled == false) {
							outString += produceCode(needleObj, place, depthAdjustment);
							place.handled = true;
						}
						outString += produceCode(commandObj, place, depthAdjustment, true);
					}
				}
				// else if () {
	
				// }
	
				// "Default" outcome (for rotation variant patterns)
				
				else {
					if (place.handled == false) {
						outString += produceCode(needleObj, place, depthAdjustment);
						place.handled = true;
					}
					if (lastPlace[lastPlace.length-pattern[patternIndex]].handled == false) {
						outString += produceCode(needleObj, lastPlace[lastPlace.length-pattern[patternIndex]], depthAdjustment);
						lastPlace[lastPlace.length-pattern[patternIndex]].handled = true;
					}
					outString += produceCode(commandObj, place, depthAdjustment, false, true); // only aim
					outString += aimGCodePart(place, lastPlace[lastPlace.length-pattern[patternIndex]], commandObj.defaultLength, commandObj.gcode); // rotate and add aimed plug&play G-Code
				}
			}
		}


		patternIndex += 1;
		if (patternIndex >= pattern.length) patternIndex = 0;

		lastPlace.push(place);
		placeCounter += 1;
	}
	// console.log("outStringAdded: " + outString.length);
	return outString;
} 

function addGCodePart(outString, params, placeList, commandObj, depthAdjustment, reverse=false, memoryList=[], memoryObj={}) {
	var connectionMemoryList = [];
	// console.log({MSG:"Adding GCode", commandObj:commandObj, depthAdjustment:depthAdjustment, placeList:placeList, params:params});
	// console.log("outString: " + outString.length);
	var lastPlace = [];
	var patternIndex = 0;
	let placeCounter = 0;
	// for (let i = -5; i < 5; i++) { 
	// 	console.log(mod(i, commandObj.pattern.length));
	// }

	let pattern = [...commandObj.pattern];
	// console.log('pattern: ', pattern);

	let placeListLocal = [...placeList];
	if (pattern.length == 0) {
		// pattern = [1];
	}
	if (reverse) {
		pattern = pattern.reverse();
		placeListLocal = placeListLocal.reverse();
	}

	memoryObj.placeList = placeListLocal;

	for (let place of placeListLocal) {
		outString += `G1 Z${commandObj.zClearing} F3000\n`; // Safety lift
		outString += `G1 X${(place.x + constXShift + commandObj.offset.x).toFixed(3)} Y${(place.y + depthAdjustment + commandObj.offset.y).toFixed(3)} F7200\n`; // XY positioning
		outString += `G1 Z${commandObj.zStart} F3000\n`; // Z positioning
		
		if (commandObj.directional == false) {
			if (pattern[patternIndex] !== 0) {
				outString += commandObj.gcode; // Adding plug&play/drag&drop G-Code
				memoryList.push({from:place, to:null});
			}
		}
		else {
			if (Math.abs(pattern[patternIndex]) == 0) {
				// If following pattern spots would connect to this, but line ends early, add skip-gcode
				for (let i = patternIndex; i < (patternIndex+pattern.length); i++) {  // check whole pattern
					const patternPlace = mod(i, pattern.length);
					if (((placeCounter+i-patternIndex+1) > placeList.length)) { // only parts of the pattern that would come after line ends 
						if ((Math.abs(pattern[patternPlace]) > 0.5)) { // Only if the pattern actually connects to something
							if (mod((i - pattern[patternPlace]), pattern.length) == patternIndex)  { // Check if it connects to the current point
								outString += commandObj.skipGCode;
								memoryList.push({from:place, to:null});
								break;
							}
						}
					}
				}
				// if ((placeCounter+1) == placeList.length) { // edge case, print counter on last hole when hole would normally be skipped
				// 	outString += commandObj.skipGCode;
				// }

			} else if (pattern[patternIndex] == 0.5) {
				if (((placeCounter+pattern.length) > (placeList.length)) || ((placeCounter-pattern.length) < -1)) {
					outString += commandObj.skipGCode;
					memoryList.push({from:place, to:null});
				}

			} else { 
				
				if (pattern[patternIndex] > lastPlace.length) { // No place saved yet, can't connect here, so add skip-gcode
					let noOut = true;
					for (let i = patternIndex; i < (patternIndex+pattern.length); i++) { // check whole pattern
						const patternPlace = mod(i, pattern.length);
						if ((Math.abs(pattern[patternPlace]) > 0.5) && (mod((i - pattern[patternPlace]), pattern.length) == patternIndex)) {
							noOut = false;
						}
					}
					if (noOut) outString += commandObj.skipGCode;
				}
				// else if () {
	
				// }
	
				// "Default" outcome (for rotation variant patterns)
				else outString += aimGCodePart(place, lastPlace[lastPlace.length-pattern[patternIndex]], commandObj.defaultLength, commandObj.gcode); // rotate and add aimed plug&play G-Code
				memoryList.push({from:lastPlace[lastPlace.length-pattern[patternIndex]], to:place}); //TODO: Check for undefined in from spot here // Perhaps only if reverse is missing but needed
			}
		}


		patternIndex += 1;
		if (patternIndex >= pattern.length) patternIndex = 0;

		lastPlace.push(place);
		placeCounter += 1;
	}
	// console.log("outStringAdded: " + outString.length);
	return outString;
} 

function exportPreviousGcode(GCODE, addedOutputs, addedShapes, addedPrintJobs) {

	GCODE = chosenPrinter.startCode + GCODE;
	
	for (let outputContainer of addedOutputs) {
		console.log('output: ', outputContainer);
		GCODE += outputContainer.output.G91.spikes.precode;
		GCODE = addGCodePart(GCODE, outputContainer.usedParam, outputContainer.output.holeList, outputContainer.output.G91.spikes, outputContainer.heightUsed);
	}

	for (let outputContainer of addedOutputs) {
		GCODE += chosenPrinter.pauseCode;
		// GCODE = addGCodePart(GCODE, outputContainer.usedParam, outputContainer.output.holeList, outputContainer.output.G91.spikesTop, outputContainer.heightUsed, true);

		// GCODE = addGCodePart(GCODE, outputContainer.usedParam, outputContainer.output.holeList, outputContainer.output.G91.top, outputContainer.heightUsed);

		let combinedcommands = [outputContainer.output.G91.top, outputContainer.output.G91.spikesTop];
		GCODE = addGCodePartsC(GCODE, outputContainer.usedParam, outputContainer.output.holeList, combinedcommands, outputContainer.heightUsed, true);

	}

	GCODE += chosenPrinter.endCode;

	// console.log('ExportedGCODE: ', GCODE);

	var blob = new Blob([GCODE], {type: 'text/plain'});
	var d = new Date();
	saveAs(blob, 'joinery_print_'+d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+'_'+d.getHours()+'.'+d.getMinutes()+'.'+d.getSeconds()+'.gcode');
	refreshShapeDisplay();
	setMessage('<b>GCODE Exported</b>', '#444');

	var printShapes = [...addedOutputs];
	var printObj = {relevantShapes:addedShapes, printedThreads:printShapes, printJobs:addedPrintJobs};
	return printObj;
}

function getAlphaID(number) {
	var alpha = "";
	function printLetter(number) {
		var charIndex = number % alphabet.length
		var quotient = number / alphabet.length
		if (charIndex - 1 == -1) {
			charIndex = alphabet.length
			quotient--;
		}
		alpha = alphabet.charAt(charIndex - 1) + alpha;
		if (quotient >= 1) {
			printLetter(parseInt(quotient));
		}
	}

	printLetter(number);
	return alpha;
}

function calcBounds(relevantShapes) {
	var localBounds = {'minX':0, 'maxX':0, 'minY':0, 'maxY':0, 'x':0, 'y':0};
	if (relevantShapes.length > 0) {
		var corners = [];
		for (i in relevantShapes) {
			var rect = relevantShapes[i].bounds;
			corners.push({'x':rect.x, 'y':rect.y});
			corners.push({'x':rect.x+rect.width, 'y':rect.y+rect.height});
		}
		corners.sort(function(a, b) {
			return a.x - b.x;
		});
		localBounds.minX = corners[0].x;
		localBounds.maxX = corners[corners.length-1].x;
		corners.sort(function(a, b) {
			return a.y - b.y;
		});
		localBounds.minY = corners[0].y;
		localBounds.maxY = corners[corners.length-1].y;
		localBounds.y = (localBounds.maxY+localBounds.minY)/2;
		localBounds.x = (localBounds.maxX+localBounds.minX)/2;
	}
	return localBounds;
}

function getLaserPreview(relevantShapes) {
	localBounds = calcBounds(relevantShapes);
	console.log({localBoundsLaser:localBounds});
	var localSVG = $(project.exportSVG({bounds:'content'})).html();
	const localWidth = localBounds.maxX-localBounds.minX;
	const localHeight = localBounds.maxY-localBounds.minY;
	var localSvgString = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+localWidth+'mm" height="'+localHeight+'mm" viewBox="'+localBounds.minX+' '+localBounds.minY+' '+localWidth+' '+localHeight+'">'+localSVG+'</svg>';
	var blob = new Blob([localSvgString], {type: 'image/svg+xml'});
	const imageData = {blob:blob, width:localWidth, height:localHeight, svgString:localSvgString};
	return imageData;
}

function getPrintPreview(relevantShapes) {
	localBounds = calcBounds(relevantShapes);
	console.log({localBounds:localBounds});
	var localSVG = $(project.exportSVG({bounds:'content'})).html();
	localBounds.minX -= 5;
	localBounds.minY -= 5;
	const localWidth = localBounds.maxX-localBounds.minX+5;
	const localHeight = localBounds.maxY-localBounds.minY+5;
	var localSvgString = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+localWidth+'mm" height="'+localHeight+'mm" viewBox="'+localBounds.minX+' '+localBounds.minY+' '+localWidth+' '+localHeight+'">'+localSVG+'</svg>';
	var blob = new Blob([localSvgString], {type: 'image/svg+xml'});
	const imageData = {blob:blob, width:localWidth, height:localHeight, svgString:localSvgString};
	return imageData;
}

function is_server() {
	return ! (typeof window != 'undefined' && window.document);
}

function exportProject() {
	emptyAll();
	activateDim(false);
	paper.view.zoom = 1;
	var prints = [];
	var allShapeIDs = new Set();


	console.log({markerGCodesExport:markerGCodes});

	if (shape.length > 0) {
		calProjectBounds();
		var heightUsed = 0.0;
		var addedOutputs = [];
		var addedShapes = [];
		var addedPrintJobs = [];
		var GCODE = "";
		for (i in shape) {
			console.log({theshape:shape[i]});
			for (j in shape[i].children) {
				if (shape[i].children[j].className=='Path') {
					if (shape[i].children[j].name=='joint') {
						if (shape[i].children[j].printJobs) {
							shape[i].children[j].strokeWidth = 1.0;
							shape[i].children[j].strokeColor = '#0F0';
						} else {
							shape[i].children[j].strokeWidth = 1.0;
							shape[i].children[j].strokeColor = '#F00';
						}
					} else {
						shape[i].children[j].strokeColor = shapeColor[i][j];
					}
				} else if (shape[i].children[j].className=='Group') {
					var shapeName = shape[i].children[j].name;
					if (typeof(shapeName)==='undefined') {
						//shape[i].children[j].strokeColor = '#F0F';
					} else {
						var shapeNameStr = shapeName.split('_');
						if (shapeNameStr[shapeNameStr.length-1] == 'joint') {
							shape[i].children[j].strokeWidth = 1.0;
							shape[i].children[j].strokeColor = '#00F';
							if (shape[i].children[j].children['folds']) {
								shape[i].children[j].children['folds'].strokeColor = '#0FF';
								if (shape[i].children[j].printJobs) {
									shape[i].children[j].strokeColor = '#FF0';
								} 
							}
							
						} else {
							//shape[i].children[j].strokeColor = '#F0F';
						}
					}
				}

				if (shape[i].children[j].printJobs) {
					var thePrintJobs = shape[i].children[j].printJobs;
					console.log({thePrintJobs:thePrintJobs});
					for (let output of shape[i].children[j].printJobs) {
						if (output.handled === false) {
							output.handled = true;
							// let outputHeight = output.sourcePath.strokeBounds.height;
							let outputHeight = output.relativeHeight.max - output.relativeHeight.min;
							if (outputHeight > output.usedParam["printing area depth"]) {
								console.error({message:"Output height larger than available printing bed space", bedDepth:output.usedParam["printing area depth"], spaceNeeded:outputHeight});
								break;
							}
							if ((outputHeight + heightUsed) > output.usedParam["printing area depth"]) {
								prints.push(exportPreviousGcode(GCODE, addedOutputs, addedShapes, addedPrintJobs));
								GCODE = "";
								heightUsed = 0;
								addedOutputs = [];
								addedShapes = [];
								addedPrintJobs = [];
							}

							console.log({relHeight:output.relativeHeight, heightUsed:heightUsed});
							
							let localHeight = heightUsed - output.relativeHeight.min + 20;
							heightUsed = heightUsed + outputHeight + 40; // Make safety spacing (Y and X) based on bounding box of drag&drop GCode
							addedOutputs.push({output:output, heightUsed:localHeight, usedParam:output.usedParam});
							addedShapes.push({shape: shape[i], ID:i});
							addedPrintJobs.push(output);
							allShapeIDs.add(i);
							console.log({allShapeIDs:allShapeIDs, i:i});

							// Add "Inject here" G-Code flag for printed markers?  
							console.log({output:output, printedTextsOutput:output.markers[0].sourceObj.printedText});
							if (output.markers[0].sourceObj.printedText[0]) {
								for (let marker of output.markers) {
									for (let pT of marker.sourceObj.printedText) {
										let outString = `G1 Z1.00 F3000\n`; // Safety lift
										outString += `G1 X${(output.holeList[0].x + pT.relVector.x + constXShift).toFixed(3)} Y${(pT.relVector.y + localHeight).toFixed(3)} F7200\n`; // XY positioning
										outString += `G1 Z${0.2} F3000\n`; // Z positioning
										GCODE += outString;
										for (let line of pT.lines) {
											GCODE += aimGCodePart(line.start, line.end, defaultLineLength, defaultLineGCode);
										}
									}
								}
							}

							if (output.markers[0].serverData)
								for (let marker of output.markers) {

									console.log({firstP: output.holeList[0], relV:marker.serverData.relVector});

									let outString = `G1 Z${marker.serverData.height+10} F3000\n`; // Safety lift
									outString += `G1 X${(output.holeList[0].x + marker.serverData.relVector.x + constXShift).toFixed(3)} Y${(marker.serverData.relVector.y + localHeight).toFixed(3)} F7200\n`; // XY positioning
									outString += `G1 Z${0.2} F3000\n`; // Z positioning

									GCODE += outString;

									GCODE += marker.serverData.markerGC;
								}
							else console.log({Warning:"Server marker data unavailable"});

							GCODE += addGCodePart(GCODE, output.usedParam, output.holeList, output.G91.base, localHeight);
						}
					}
				}
			}
		}

		if (heightUsed > 0) {
			prints.push(exportPreviousGcode(GCODE, addedOutputs, addedShapes, addedPrintJobs));
			GCODE = "";
			heightUsed = 0;
			addedOutputs = [];
			addedShapes = [];
			addedPrintJobs = [];
		}

		// var text = new PointText(new Point(projectBounds.minX, projectBounds.minY));
		// text.fillColor = 'black';
		// text.content = projectBounds.minX + ' ' + projectBounds.minY;

		var testPath = generateAsciiPolygons("T", projectBounds.minX, projectBounds.minY, 45, 10);
		console.log({testPath:testPath});

		
		var laserObjects = [];
		for (shapeID of allShapeIDs) {
			const shapeList = [shape[shapeID]];
			console.log({shapeID:shapeID, shapeList:shapeList});
			var imageData = getLaserPreview(shapeList);
			laserObjects.push({ID:shapeID, imageData:imageData});
			shape[shapeID].imageData = imageData;
			shape[shapeID].ID = shapeID;
		}

		console.log({laserObjects:laserObjects});
		
		grayOutShapes();

		for (let print of prints) {
			var printList = [];
			var threadList = [];
			var shapeImages = [];
			for (let printedThread of print.printedThreads) {
				printList.push(printedThread.output.laserHolesRefPath);
				threadList.push(printedThread);
			}
			
			

			for (let printJob of print.printJobs) {
				for (let printOutline of printJob.renderRef.a.printOutlines) {
					printOutline.strokeColor = '#02B';
					printOutline.strokeWidth = 0;
					printOutline.fillColor = '#F1D';
					printOutline.opacity = 0.25;
				}
				for (let printOutline of printJob.renderRef.b.printOutlines) {
					printOutline.strokeColor = '#02B';
					printOutline.strokeWidth = 0;
					printOutline.fillColor = '#F1D';
					printOutline.opacity = 0.25;
				}
			}

			// TODO: Make all the color mods, then get picture of relevantShapes (laserPreview)

			for (let thisShape of print.relevantShapes) {
				console.log({thisShape:thisShape});
				colorForLaser(thisShape.shape);
				const shapeList = [thisShape.shape];
				var imageData = getLaserPreview(shapeList);
				shapeImages.push(imageData);
			}


			var imageData = getPrintPreview(printList);
			// laserObjects.push({ID:"5", imageData:imageData});

			print.imageData = imageData;
			print.shapeImages = shapeImages;

			console.log({shapeImages:shapeImages});
			console.log({printList:printList, threadList:threadList, prints:prints});

			grayOutShapes();

		}



		var svgWidth = projectBounds.maxX-projectBounds.minX;
		var svgHeight = projectBounds.maxY-projectBounds.minY;
		console.log({svgWidth:svgWidth, svgHeight:svgHeight});
		var svgContent = $(project.exportSVG({bounds:'content'})).html();
		var svgString = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+svgWidth+'mm" height="'+svgHeight+'mm" viewBox="'+projectBounds.minX+' '+projectBounds.minY+' '+svgWidth+' '+svgHeight+'">'+svgContent+'</svg>';
		
		// console.log(svgString);

		var blob = new Blob([svgString], {type: 'image/svg+xml'});
		var d = new Date();
		saveAs(blob, 'joinery_'+d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+'_'+d.getHours()+'.'+d.getMinutes()+'.'+d.getSeconds()+'.svg');
		refreshShapeDisplay();
		setMessage('<b>SVG Exported</b>', '#444');

		const url = URL.createObjectURL(blob);
		const image = document.createElement('img');
		image.addEventListener('load', () => URL.revokeObjectURL(url), {once: true});
		image.src = url;
		image.width = 100;
		console.log({url:url, image:image});
		var urlString = url.substring(5);
		var imgHtml = "<img source=\""+urlString+"\" target=\"_BLANK\">";
		$("#TestDiv").append(image);
		var exportWindow = window.open("pages/export-status.html?"+"none", "Export", "width=800,height=600");// "width=200,height=100");
		exportWindow.prints = prints;
		exportWindow.laserObjects = laserObjects;
		exportWindow.allShapeIDs = allShapeIDs;
		exportWindow.svgContent = svgContent;

		exportWindow["myVar"] = "Hello World";
		
		// exportWindow.window.imageList = [image, "no"];
		// exportWindow.window["myVar"] = "Hello World2";
		//myWindow.document.write("<p>This is 'MsgWindow'. I am 200px wide and 100px tall!</p>");

		var fabOrder = generateFabricationOrder(prints, laserObjects, allShapeIDs, svgContent);
		exportWindow.flat = fabOrder.flattened;
		exportWindow.order = fabOrder.order;

		console.log(fabOrder);
	
	} else {
		setMessage('<b>No drawings to export</b>', '#F80');
	}
	paper.view.zoom = paperScale;
	activateDim(dimBool);
	refreshShapeDisplay();
}