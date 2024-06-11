// const { get } = require("request-promise");

// Original combining printJobs into few prints
function exportPrintSets(printSetsList, chosenPrinter) {
	var prints2 = [];
	var heightUsed2 = 0.0;
	var addedOutputs2 = [];
	var addedShapes2 = [];
	var addedPrintJobs2 = [];
	let fakeShapeIDs = new Set();
	var GCODE2 = "";
	for (let printSet of printSetsList) {
		console.log('printSet: ', printSet);
		console.log({shapeID:printSet.parentshapeID});
		[GCODE2, heightUsed2] = handlePrintJobs(printSet.printJobs, GCODE2, prints2, heightUsed2, addedOutputs2, addedShapes2, addedPrintJobs2, fakeShapeIDs, chosenPrinter, printSet.parentshapeID);
	}
	[GCODE2, heightUsed2] = handleLeftoverGCode(GCODE2, prints2, addedOutputs2, addedShapes2, addedPrintJobs2, chosenPrinter, heightUsed2);
	var combinedPrints = prints2;
	return combinedPrints;
}

function calculateDurationEstimate(printJobs, simulatedHeight, types) {
	// parse types string, split by ;
	let typeList = types.split(";");
	let calcBase = false, calcSpikes = false, calcTop = false, calcSpikesTop = false;
	if (typeList.includes("base")) calcBase = true;
	if (typeList.includes("spikes")) calcSpikes = true;
	if (typeList.includes("top")) calcTop = true;
	if (typeList.includes("spikesTop")) calcSpikesTop = true;
	let durationEstimate = 0;
	let warn = false;
	for (let output of printJobs) {

		let outputHeight = output.relativeHeight.max - output.relativeHeight.min;
		if ((outputHeight + simulatedHeight) > output.usedParam["printing area depth"]) {
			return durationEstimate;
		}
		if (calcBase) {
			if (output.G91.base.duration) {
				durationEstimate += output.holeList.length * (output.G91.base.duration + switchMoveDuration);
			} 
			else {
				warn = true;
				durationEstimate += output.holeList.length * switchMoveDuration;
			}
		} 
		if (calcSpikes) {
			if (output.G91.spikes.duration) {
				durationEstimate += output.holeList.length * (output.G91.spikes.duration + switchMoveDuration);
			} 
			else {
				warn = true;
				durationEstimate += output.holeList.length * switchMoveDuration;
			}
		}
		if (calcTop) {
			if (output.G91.top.duration) {
				durationEstimate += output.holeList.length * (output.G91.top.duration + switchMoveDuration);
			} 
			else {
				warn = true;
				durationEstimate += output.holeList.length * switchMoveDuration;
			}
		}
		if (calcSpikesTop) {
			if (output.G91.spikesTop.duration) {
				durationEstimate += output.holeList.length * (output.G91.spikesTop.duration + switchMoveDuration);
			} 
			else {
				warn = true;
				durationEstimate += output.holeList.length * switchMoveDuration;
			}
		}
	}
	if (warn) {
		console.warn({message:"Duration estimate not available for output", output:output});
	}
	return durationEstimate;
}

function calculateTopDurationEstimate(printJob, types) {
	// parse types string, split by ;
	let typeList = types.split(";");
	let calcBase = false, calcSpikes = false, calcTop = false, calcSpikesTop = false;
	if (typeList.includes("base")) calcBase = true;
	if (typeList.includes("spikes")) calcSpikes = true;
	if (typeList.includes("top")) calcTop = true;
	if (typeList.includes("spikesTop")) calcSpikesTop = true;
	let durationEstimate = 0;
	let warn = false;
	if (calcBase) {
		if (printJob.G91.base.duration) {
			durationEstimate += printJob.holeList.length * (printJob.G91.base.duration + switchMoveDuration);
			durationEstimate += printJob.holeList.length * switchMoveDuration;
		}
		else {
			warn = true;
		}
	}
	if (calcSpikes) {
		if (printJob.G91.spikes.duration) {
			durationEstimate += printJob.holeList.length * (printJob.G91.spikes.duration + switchMoveDuration);
			durationEstimate += printJob.holeList.length * switchMoveDuration;
		}
		else {
			warn = true;
		}
	}
	if (calcTop) {
		if (printJob.G91.top.duration) {
			durationEstimate += printJob.holeList.length * (printJob.G91.top.duration + switchMoveDuration);
			durationEstimate += printJob.holeList.length * switchMoveDuration;
		}
		else {
			warn = true;
		}
	} 
	if (calcSpikesTop) {
		if (printJob.G91.spikesTop.duration) {
			durationEstimate += printJob.holeList.length * (printJob.G91.spikesTop.duration + switchMoveDuration);
			durationEstimate += printJob.holeList.length * switchMoveDuration;
		}
		else {
			warn = true;
		}
	} 

	if (warn) {
		console.warn({message:"Duration estimate not available for output", output:printJob});
	}
	return durationEstimate;
}

function handlePrintJobs(printJobs, GCODE, prints, heightUsed, addedOutputs, addedShapes, addedPrintJobs, allShapeIDs, chosenPrinter, shape_i) {
    // First simulate process of adding jobs until export, to calculate duration estimate
	let simulatedHeight = heightUsed*1.0;
	let remainingPrintJobs = [...printJobs];
	let durationEstimate = calculateDurationEstimate(remainingPrintJobs, simulatedHeight, "base;spikes"); // Pause only after both base+spikes
	// let durationEstimateTotal = calculateDurationEstimate(remainingPrintJobs, simulatedHeight, "base;spikes;top;spikesTop");
	let toComeEstimate = calculateDurationEstimate(remainingPrintJobs, simulatedHeight, "top;spikesTop");
	let durationEstimateTotal = durationEstimate + toComeEstimate;
	console.log("Handle Jobs. Duration estimate: " + durationEstimate + " toComeEstimate: " + toComeEstimate + " total: " + durationEstimateTotal);
	let durations = {durationEstimate: durationEstimate, toComeEstimate: toComeEstimate, durationEstimateTotal: durationEstimateTotal};
	for (let output of printJobs) {
        if (true || output.handled2 === false) {
            output.handled2 = true;
			remainingPrintJobs.shift();
            // let outputHeight = output.sourcePath.strokeBounds.height;
            let outputHeight = output.relativeHeight.max - output.relativeHeight.min;
            if (outputHeight > output.usedParam["printing area depth"]) {
                console.error({message:"Output height larger than available printing bed space", bedDepth:output.usedParam["printing area depth"], spaceNeeded:outputHeight});
                break;
            }
            if ((outputHeight + heightUsed) > output.usedParam["printing area depth"]) {
				console.log("Height exceeded, new print");
                prints.push(exportPreviousGcodeGlobal(GCODE, addedOutputs, addedShapes, addedPrintJobs, chosenPrinter));
                GCODE = "";
                heightUsed = 0;
                addedOutputs = [];
                addedShapes = [];
                addedPrintJobs = [];
				simulatedHeight = heightUsed*1.0;
				durationEstimate = calculateDurationEstimate(remainingPrintJobs, simulatedHeight, "base;spikes");
				toComeEstimate = calculateDurationEstimate(remainingPrintJobs, simulatedHeight, "top;spikesTop");
				durationEstimateTotal = durationEstimate + toComeEstimate;
				console.log("Post split Jobs. Duration estimate: " + durationEstimate + " toComeEstimate: " + toComeEstimate + " total: " + durationEstimateTotal);
				durations = {durationEstimate: durationEstimate, toComeEstimate: toComeEstimate, durationEstimateTotal: durationEstimateTotal};
            }

            // console.log({relHeight:output.relativeHeight, heightUsed:heightUsed});
            
            let localHeight = heightUsed - output.relativeHeight.min + 20;
            heightUsed = heightUsed + outputHeight + 40; // Make safety spacing (Y and X) based on bounding box of drag&drop GCode
            addedOutputs.push({output:output, heightUsed:localHeight, print_Offset_X:output.print_Offset_X, usedParam:output.usedParam, duration:durationEstimateTotal});
            addedShapes.push({shape: shape[shape_i], ID:shape_i});
            addedPrintJobs.push(output);
            allShapeIDs.add(shape_i);
            // console.log({allShapeIDs:allShapeIDs, i:shape_i});

			// TODO Add duration estimate for markers to total (and subtract later)

            // Add "Inject here" G-Code flag for printed markers?  
            // console.log({output:output, printedTextsOutput:output.markers[0].sourceObj.printedText});
            if (output.markers[0].sourceObj.printedText[0]) {
                for (let marker of output.markers) {
                    for (let pT of marker.sourceObj.printedText) {
                        let outString = `G1 Z1.00 F3000\n`; // Safety lift
                        outString += `G1 X${(output.holeList[0].x + pT.relVector.x + output.print_Offset_X).toFixed(3)} Y${(pT.relVector.y + localHeight).toFixed(3)} F7200\n`; // XY positioning
                        outString += `G1 Z${0.2} F3000\n`; // Z positioning
                        GCODE += outString;
                        for (let line of pT.lines) {
                            GCODE += getCodeWRetraction(aimGCodePartG(line.start, line.end, defaultLineCommandObj), chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate);
                        }
                    }
                }
            }

            if (output.markers[0].serverData)
                for (let marker of output.markers) {

                    // console.log({firstP: output.holeList[0], relV:marker.serverData.relVector});

                    let outString = `G1 Z${marker.serverData.height+10} F3000\n`; // Safety lift
                    outString += `G1 X${(output.holeList[0].x + marker.serverData.relVector.x + output.print_Offset_X).toFixed(3)} Y${(marker.serverData.relVector.y + localHeight).toFixed(3)} F7200\n`; // XY positioning
                    outString += `G1 Z${0.2} F3000\n`; // Z positioning

                    GCODE += outString;

					GCODE += getCodeWRetraction(marker.serverData.markerGC, chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate);
                }
            else {
				// console.log({Warning:"Server marker data unavailable"}); 
			}
            GCODE = addGCodePartGlobal(GCODE, output.usedParam, output.holeList, output.G91.base, localHeight, output.print_Offset_X, durations);
			console.log('+Bottom GCode');
			// console.log(GCODE);
        }
    }
    return [GCODE, heightUsed];
}

function handleLeftoverGCode(GCODE, prints, addedOutputs, addedShapes, addedPrintJobs, chosenPrinter, heightUsed) {
    if (heightUsed > 0) {
        prints.push(exportPreviousGcodeGlobal(GCODE, addedOutputs, addedShapes, addedPrintJobs, chosenPrinter));
        GCODE = "";
        heightUsed = 0;
        addedOutputs = [];
        addedShapes = [];
        addedPrintJobs = [];
    }
    return [GCODE, heightUsed];
}

function exportPreviousGcodeGlobal(GCODE, addedOutputs, addedShapes, addedPrintJobs, chosenPrinter) {
	let targetTemp = 215;
	console.log('addedOutputs: ', addedOutputs);
	console.log('addedShapes: ', addedShapes);
	if (addedOutputs[0].usedParam["printing temperature"]) {
		targetTemp = addedOutputs[0].usedParam["printing temperature"];
	}
	let adjustedStartCode = chosenPrinter.startCode;
	adjustedStartCode += `G1 E-${chosenPrinter.retractionLength} F${chosenPrinter.retractionSpeed*60}; Retraction\n`; // Retraction;
	adjustedStartCode = adjustedStartCode.replace(/(M10[49] S)(?!0)\d+/g, `$1${targetTemp}`); // Replace setting and waiting for temp with adjusted temperature

    GCODE = adjustedStartCode + GCODE;

	let durationEstimate = calculateDurationEstimate(addedPrintJobs, -Infinity, "spikes"); // Ingore look-ahead by using infinite height
    let toComeEstimate = calculateDurationEstimate(addedPrintJobs, -Infinity, "top;spikesTop"); 
	console.log({durationType: "spikesOnly", durationEstimate:durationEstimate, toComeEstimate:toComeEstimate});
	let durations = {durationEstimate: durationEstimate, toComeEstimate: toComeEstimate, durationEstimateTotal: addedOutputs[0].duration};
	console.log("Export previous. Duration estimate: " + durationEstimate + " toComeEstimate: " + toComeEstimate + " total: " + addedOutputs[0].duration);
    for (let outputContainer of addedOutputs) {
		durations.durationEstimateTotal = outputContainer.duration;
        // console.log('output: ', outputContainer);
        GCODE += outputContainer.output.G91.spikes.precode;
        GCODE = addGCodePartGlobal(GCODE, outputContainer.usedParam, outputContainer.output.holeList, outputContainer.output.G91.spikes, outputContainer.heightUsed, outputContainer.print_Offset_X, durations);
		console.log("+Spikes GCode in exportPreviousGcodeGlobal");
		// console.log(GCODE);
    }
	if (durations.durationEstimate > 0) {
		console.warn({message:"Duration estimate not fully used: "+durations.durationEstimate, durationEstimate:durations.durationEstimate});
	}

    for (let outputContainer of addedOutputs) {
		durations.durationEstimateTotal = outputContainer.duration;
        let adjustedPauseCode = chosenPrinter.pauseCode;

		if (outputContainer.usedParam["printing temperature"]) { 
			targetTemp = outputContainer.usedParam["printing temperature"];
		}
		adjustedPauseCode = adjustedPauseCode.replace(/(M10[49] S)(?!0)\d+/g, `$1${targetTemp}`); // Replace setting and waiting for temp with adjusted temperature
		
		GCODE += adjustedPauseCode;

        // GCODE = addGCodePart(GCODE, outputContainer.usedParam, outputContainer.output.holeList, outputContainer.output.G91.spikesTop, outputContainer.heightUsed, true);

        // GCODE = addGCodePart(GCODE, outputContainer.usedParam, outputContainer.output.holeList, outputContainer.output.G91.top, outputContainer.heightUsed);

		durations.durationEstimate = calculateTopDurationEstimate(outputContainer.output, "top;spikesTop");
		durations.toComeEstimate -= durations.durationEstimate; // Subtract duration of one job from total toComeEstimate
        let combinedcommands = [outputContainer.output.G91.top, outputContainer.output.G91.spikesTop];
		console.log("per output export: durationEstimate: " + durations.durationEstimate + " toComeEstimate: " + durations.toComeEstimate + " total: " + durations.durationEstimateTotal);
        GCODE = addGCodePartsCGlobal(GCODE, outputContainer.usedParam, outputContainer.output.holeList, combinedcommands, outputContainer.heightUsed, outputContainer.print_Offset_X, true, durations);
		console.log("+TopWithSpikes GCode in exportPreviousGcodeGlobal");
		// console.log(GCODE);
    }

	GCODE += `G1 E${chosenPrinter.retractionLength} F${chosenPrinter.deretractionSpeed*60}; De-retraction\n`; // De-Retraction;
    GCODE += chosenPrinter.endCode;

    // // console.log('ExportedGCODE: ', GCODE);

    var blob = new Blob([GCODE], {type: 'text/plain'});
    var d = new Date();
    // saveAs(blob, 'joinery_print_'+d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+'_'+d.getHours()+'.'+d.getMinutes()+'.'+d.getSeconds()+'.gcode');
    // refreshShapeDisplay();
    // setMessage('<b>GCODE Exported</b>', '#444');

    var printShapes = [...addedOutputs];
    var printObj = {relevantShapes:addedShapes, printedThreads:printShapes, printJobs:addedPrintJobs, fabricated:false, gCodeBlob:blob, gcodeString:GCODE};
    return printObj;
}



// Combination of printed needle and thread
function addGCodePartsCGlobal(inString, params, placeList, commandObjs, depthAdjustment, print_Offset_X, reverse=false, durations) {
	// // console.log({MSG:"Adding GCode", commandObj:commandObj, depthAdjustment:depthAdjustment, placeList:placeList, params:params});
	// // console.log("outString: " + outString.length);

	outString = "";

	commandObj = commandObjs[0];
	needleObj = commandObjs[1];

	function handlePreCode(commandObj, place, depthAdjustment, durations) {
		let preCodeString = `G1 Z${commandObj.zClearing} F3000\n`; // Safety lift
		preCodeString += `G1 X${(place.x + print_Offset_X + commandObj.offset.x).toFixed(3)} Y${(place.y + depthAdjustment + commandObj.offset.y).toFixed(3)} F7200\n`; // XY positioning
		preCodeString += `G1 Z${commandObj.zStart} F3000\n`; // Z positioning
		preCodeString += getCodeWRetraction(commandObj.preCode, chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate);
		handleFirstPlace = false;
		return preCodeString;
	}
	
	function produceCode(commandObj, place, depthAdjustment, durations, skip=false, onlyAim=false, last=false) {
		let addString = "";
		addString += `G1 Z${commandObj.zClearing} F3000\n`; // Safety lift
		addString += `G1 X${(place.x + print_Offset_X + commandObj.offset.x).toFixed(3)} Y${(place.y + depthAdjustment + commandObj.offset.y).toFixed(3)} F7200\n`; // XY positioning
		addString += `G1 Z${commandObj.zStart} F3000\n`; // Z positioning
		
		if (onlyAim) {
			return addString;
		}
		if (skip) {
			addString += getCodeWRetraction(commandObj.skipGCode, chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate);
		}
		else if (last) {
			addString += getCodeWRetraction(commandObj.postCode, chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate);
		}
		else {
			addString += getCodeWRetraction(commandObj.gcode, chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate);
		}
		addString = addString;
		return addString;
	}
	
	var lastPlace = [];
	var patternIndex = 0;
	let placeCounter = 0;
	let handleFirstPlace = false;
	if (commandObj.preCode) {
		handleFirstPlace = true;
	}
	// for (let i = -5; i < 5; i++) { 
	// 	// console.log(mod(i, commandObj.pattern.length));
	// }

	let pattern = [...commandObj.pattern];
	// // console.log('pattern: ', pattern);

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

	// This puts it before the needle...
	// if (placeListLocal.length > 0 && commandObj.preCode) { // TODO: This assumes the first place is actually used, which is only true for patterns that use all holes
	// 	outString += `G1 Z${commandObj.zClearing} F3000\n`; // Safety lift
	// 	outString += `G1 X${(placeListLocal[0].x + print_Offset_X + commandObj.offset.x).toFixed(3)} Y${(placeListLocal[0].y + depthAdjustment + commandObj.offset.y).toFixed(3)} F7200\n`; // XY positioning
	// 	outString += `G1 Z${commandObj.zStart} F3000\n`; // Z positioning
	// 	outString += getCodeWRetraction(commandObj.preCode, chosenPrinter);
	// }

	for (let place of placeListLocal) {
		// outString += `G1 Z${commandObj.zClearing} F3000\n`; // Safety lift
		// outString += `G1 X${(place.x + print_Offset_X + commandObj.offset.x).toFixed(3)} Y${(place.y + depthAdjustment + commandObj.offset.y).toFixed(3)} F7200\n`; // XY positioning
		// outString += `G1 Z${commandObj.zStart} F3000\n`; // Z positioning
		
		if (commandObj.directional == false) {
			if (pattern[patternIndex] !== 0) {
				// outString += commandObj.gcode; // Adding plug&play/drag&drop G-Code
				outString += produceCode(needleObj, place, depthAdjustment, durations);
				if (handleFirstPlace) {
					outString += handlePreCode(commandObj, place, depthAdjustment, durations);
				}
				outString += produceCode(commandObj, place, depthAdjustment, durations, false);
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
									outString += produceCode(needleObj, place, depthAdjustment, durations);
									place.handled = true;
								}
								if (handleFirstPlace) {
									outString += handlePreCode(commandObj, place, depthAdjustment, durations);
								}
								outString += produceCode(commandObj, place, depthAdjustment, durations, true);
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
						outString += produceCode(needleObj, place, depthAdjustment, durations);
						place.handled = true;
					}
					if (handleFirstPlace) {
						outString += handlePreCode(commandObj, place, depthAdjustment, durations);
					}
					outString += produceCode(commandObj, place, depthAdjustment, durations, true);
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
							outString += produceCode(needleObj, place, depthAdjustment, durations);
							place.handled = true;
						}
						if (handleFirstPlace) {
							outString += handlePreCode(commandObj, place, depthAdjustment, durations);
						}
						outString += produceCode(commandObj, place, depthAdjustment, durations, true);
					}
				}
				// else if () {
	
				// }
	
				// "Default" outcome (for rotation variant patterns)
				
				else {
					if (place.handled == false) {
						outString += produceCode(needleObj, place, depthAdjustment, durations);
						place.handled = true;
					}
					if (lastPlace[lastPlace.length-pattern[patternIndex]].handled == false) {
						outString += produceCode(needleObj, lastPlace[lastPlace.length-pattern[patternIndex]], depthAdjustment, durations);
						lastPlace[lastPlace.length-pattern[patternIndex]].handled = true;
					}
					if (handleFirstPlace) {
						outString += handlePreCode(commandObj, lastPlace[lastPlace.length-pattern[patternIndex]], depthAdjustment, durations); // first target place should be the actual first hole
					}
					outString += produceCode(commandObj, place, depthAdjustment, durations, false, true); // only aim
					outString += getCodeWRetraction(aimGCodePartG(place, lastPlace[lastPlace.length-pattern[patternIndex]], commandObj), chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate); // rotate and add aimed plug&play G-Code
				}
			}
		}


		patternIndex += 1;
		if (patternIndex >= pattern.length) patternIndex = 0;

		lastPlace.push(place);
		placeCounter += 1;

		if (commandObj.duration) durations.durationEstimate -= commandObj.duration;
		if (needleObj.duration) durations.durationEstimate -= needleObj.duration;
		durations.durationEstimate -= switchMoveDuration*2;
		if (durations.durationEstimate < 0) {
			durations.durationEstimate = 0;
			console.warn({message:"Duration estimate reached negative value"});
		}
	}
	// // console.log("outStringAdded: " + outString.length);

	if (commandObj.postCode && lastPlace.length > 0) { // TODO: This assumes the last place is actually used, which is only true for patterns that use all holes
		outString += produceCode(commandObj, lastPlace[lastPlace.length-1], depthAdjustment, durations, false, false, true);
	}

	let targetTemp = 215;
	if (params["printing temperature"]) { 
		targetTemp = params["printing temperature"];
	}
	outString = outString.replace(/(M10[49] S)(?!0)\d+/g, `$1${targetTemp}`); // Replace setting and waiting for temp with adjusted temperature

	inString += outString;

	return inString;
} 

function addGCodePartGlobal(inString, params, placeList, commandObj, depthAdjustment, print_Offset_X, durations, reverse=false, memoryList=[], memoryObj={}) {
	console.log('in string length: ', inString.length);	
	var connectionMemoryList = [];
	// // console.log({MSG:"Adding GCode", commandObj:commandObj, depthAdjustment:depthAdjustment, placeList:placeList, params:params});
	// // console.log("outString: " + outString.length);
	var lastPlace = [];
	var patternIndex = 0;
	let placeCounter = 0;
	let firstPlacement = true;
	// for (let i = -5; i < 5; i++) { 
	// 	// console.log(mod(i, commandObj.pattern.length));
	// }

	let outString = "";

	let pattern = [...commandObj.pattern];
	// // console.log('pattern: ', pattern);

	let placeListLocal = [...placeList];
	if (pattern.length == 0) {
		// pattern = [1];
	}
	if (reverse) {
		pattern = pattern.reverse();
		placeListLocal = placeListLocal.reverse();
	}

	memoryObj.placeList = placeListLocal;

	if (placeListLocal.length > 0 && commandObj.preCode) { // TODO: This assumes the first place is actually used, which is only true for patterns that use all holes
		outString += `G1 Z${commandObj.zClearing} F3000\n`; // Safety lift
		outString += `G1 X${(placeListLocal[0].x + print_Offset_X + commandObj.offset.x).toFixed(3)} Y${(placeListLocal[0].y + depthAdjustment + commandObj.offset.y).toFixed(3)} F7200\n`; // XY positioning
		outString += `G1 Z${commandObj.zStart} F3000\n`; // Z positioning
		outString += getCodeWRetraction(commandObj.preCode, chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate);
	}

	for (let place of placeListLocal) {
		outString += `G1 Z${commandObj.zClearing} F3000\n`; // Safety lift
		outString += `G1 X${(place.x + print_Offset_X + commandObj.offset.x).toFixed(3)} Y${(place.y + depthAdjustment + commandObj.offset.y).toFixed(3)} F7200\n`; // XY positioning
		outString += `G1 Z${commandObj.zStart} F3000\n`; // Z positioning
		
		if (commandObj.directional == false) {
			if (pattern[patternIndex] !== 0) {
				outString += getCodeWRetraction(commandObj.gcode, chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate); // Adding plug&play/drag&drop G-Code
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
								outString += getCodeWRetraction(commandObj.skipGCode, chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate);
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
					outString += getCodeWRetraction(commandObj.skipGCode, chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate);
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
					if (noOut) {
						outString += getCodeWRetraction(commandObj.skipGCode, chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate);
						memoryList.push({from:null, to:place}); //TODO: Check if it makes sense to have a memoryList entry if there is no FROM // TODO: Or if there should be one for noOut True
					}
				}
				// else if () {
	
				// }
	
				// "Default" outcome (for rotation variant patterns)
				else {
					outString += getCodeWRetraction(aimGCodePartG(place, lastPlace[lastPlace.length-pattern[patternIndex]], commandObj), chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate);
					memoryList.push({from:lastPlace[lastPlace.length-pattern[patternIndex]], to:place}); 
				}
			}
		}


		patternIndex += 1;
		if (patternIndex >= pattern.length) patternIndex = 0;

		lastPlace.push(place);
		placeCounter += 1;
		if (commandObj.duration) durations.durationEstimate -= commandObj.duration;
		durations.durationEstimate -= switchMoveDuration;
		if (durations.durationEstimate < 0) {
			durations.durationEstimate = 0;
			console.warn({message:"Duration estimate reached negative value"});
		}
		console.log('duration estimate: ', durations.durationEstimate);
	}

	if (commandObj.postCode && lastPlace.length > 0) { // TODO: This assumes the last place is actually used, which is only true for patterns that use all holes
		outString += `G1 Z${commandObj.zClearing} F3000\n`; // Safety lift
		outString += `G1 X${(lastPlace[lastPlace.length-1].x + print_Offset_X + commandObj.offset.x).toFixed(3)} Y${(lastPlace[lastPlace.length-1].y + depthAdjustment + commandObj.offset.y).toFixed(3)} F7200\n`; // XY positioning
		outString += `G1 Z${commandObj.zStart} F3000\n`; // Z positioning
		outString += getCodeWRetraction(commandObj.postCode, chosenPrinter, durations.durationEstimate, durations.durationEstimateTotal, durations.toComeEstimate);
	}

	// // console.log("outStringAdded: " + outString.length);
	let targetTemp = 215;
	if (params["printing temperature"]) { 
		targetTemp = params["printing temperature"];
	}
	outString = outString.replace(/(M10[49] S)(?!0)\d+/g, `$1${targetTemp}`); // Replace setting and waiting for temp with adjusted temperature

	inString += outString;
	console.log('out string length: ', inString.length);

	return inString;
} 

function mod(n, m) {
	return ((n % m) + m) % m;
};


function aimGCodePartG(startPlace, endPlace, commandObj) {
	var outGCode = '\n';
	var deltaX = endPlace.x - startPlace.x;
	var deltaY = endPlace.y - startPlace.y;
	const length = Math.sqrt((deltaX*deltaX) + (deltaY*deltaY));

	let patternDefaultLength = null;
	let gcode = null;

	if (commandObj.gCodeOptions) {
		// Get best option from gCodeOptions in commandObj that is closest to the length
		console.log({length:length, commandObj:commandObj});
		let bestOption = commandObj.gCodeOptions[0];
		let closestLength = Math.abs(length - bestOption.defaultLength);
		for (let option of commandObj.gCodeOptions) {
			let optionLength = Math.abs(length - option.defaultLength);
			if (optionLength < closestLength) {
				bestOption = option;
				closestLength = optionLength;
			}
		}
		patternDefaultLength = bestOption.defaultLength;
		gcode = bestOption.gcode;
	} else {
		patternDefaultLength = commandObj.defaultLength;
		gcode = commandObj.gcode;
	}
	
	lengthFactor = length / patternDefaultLength;
	// console.log({length:length, lengthFactor:lengthFactor});
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

function getCodeWRetraction(inString, chosenPrinter, durationEstimate=0, durationEstimateTotal=0, toComeEstimate=0) {
	let outString = `G1 E${(chosenPrinter.retractionLength + chosenPrinter.extraDeretractionLength).toFixed(3)} F${(chosenPrinter.deretractionSpeed*60).toFixed(3)}; De-retraction\n`; // De-Retraction;
	let percentage = durationEstimateTotal !== 0 ? Math.round((1-((durationEstimate+toComeEstimate) / durationEstimateTotal)) * 100) : 0;
	outString += inString;
	outString += `G1 E-${chosenPrinter.retractionLength} F${(chosenPrinter.retractionSpeed*60).toFixed(3)}; Retraction\n`; // Retraction;
	outString += `M73 P${percentage} R${Math.floor(durationEstimate/60)}; Progress\n`; // Progress update
	outString += `M73 Q${percentage} S${Math.floor(durationEstimate/60)}; Progress\n`; // Silent progress update
	return outString;
}