function generateSingleLinePrint(index, shapeA, pathA, shapeB, pathB, param, G91) {
	var returnB = [];
	var returnA = [];
	var returnAFold = [];
	var returnBFold = [];
	// var G91 = printTemplate.G91Commands;
	var G91Obj = G91;
	var skipHoles = Math.floor(param['skip # holes']);

	console.log({warning:"Deprecated"});
	
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
			cutCircle.strokeColor = laserColor;

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