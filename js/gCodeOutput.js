function handlePrintJobs(printJobs, GCODE, prints, heightUsed, addedOutputs, addedShapes, addedPrintJobs, allShapeIDs, chosenPrinter) {
    for (let output of printJobs) {
        if (true || output.handled2 === false) {
            output.handled2 = true;
            // let outputHeight = output.sourcePath.strokeBounds.height;
            let outputHeight = output.relativeHeight.max - output.relativeHeight.min;
            if (outputHeight > output.usedParam["printing area depth"]) {
                console.error({message:"Output height larger than available printing bed space", bedDepth:output.usedParam["printing area depth"], spaceNeeded:outputHeight});
                break;
            }
            if ((outputHeight + heightUsed) > output.usedParam["printing area depth"]) {
                prints.push(exportPreviousGcodeGlobal(GCODE, addedOutputs, addedShapes, addedPrintJobs, chosenPrinter));
                GCODE = "";
                heightUsed = 0;
                addedOutputs = [];
                addedShapes = [];
                addedPrintJobs = [];
            }

            // console.log({relHeight:output.relativeHeight, heightUsed:heightUsed});
            
            let localHeight = heightUsed - output.relativeHeight.min + 20;
            heightUsed = heightUsed + outputHeight + 40; // Make safety spacing (Y and X) based on bounding box of drag&drop GCode
            addedOutputs.push({output:output, heightUsed:localHeight, usedParam:output.usedParam});
            addedShapes.push({shape: shape[i], ID:i});
            addedPrintJobs.push(output);
            allShapeIDs.add(i);
            // console.log({allShapeIDs:allShapeIDs, i:i});

            // Add "Inject here" G-Code flag for printed markers?  
            // console.log({output:output, printedTextsOutput:output.markers[0].sourceObj.printedText});
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

                    // console.log({firstP: output.holeList[0], relV:marker.serverData.relVector});

                    let outString = `G1 Z${marker.serverData.height+10} F3000\n`; // Safety lift
                    outString += `G1 X${(output.holeList[0].x + marker.serverData.relVector.x + constXShift).toFixed(3)} Y${(marker.serverData.relVector.y + localHeight).toFixed(3)} F7200\n`; // XY positioning
                    outString += `G1 Z${0.2} F3000\n`; // Z positioning

                    GCODE += outString;

                    GCODE += marker.serverData.markerGC;
                }
            else // console.log({Warning:"Server marker data unavailable"});

            GCODE += addGCodePart(GCODE, output.usedParam, output.holeList, output.G91.base, localHeight);
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
    GCODE = chosenPrinter.startCode + GCODE;
    
    for (let outputContainer of addedOutputs) {
        // console.log('output: ', outputContainer);
        GCODE += outputContainer.output.G91.spikes.precode;
        GCODE = addGCodePartGlobal(GCODE, outputContainer.usedParam, outputContainer.output.holeList, outputContainer.output.G91.spikes, outputContainer.heightUsed);
    }

    for (let outputContainer of addedOutputs) {
        GCODE += chosenPrinter.pauseCode;
        // GCODE = addGCodePart(GCODE, outputContainer.usedParam, outputContainer.output.holeList, outputContainer.output.G91.spikesTop, outputContainer.heightUsed, true);

        // GCODE = addGCodePart(GCODE, outputContainer.usedParam, outputContainer.output.holeList, outputContainer.output.G91.top, outputContainer.heightUsed);

        let combinedcommands = [outputContainer.output.G91.top, outputContainer.output.G91.spikesTop];
        GCODE = addGCodePartsCGlobal(GCODE, outputContainer.usedParam, outputContainer.output.holeList, combinedcommands, outputContainer.heightUsed, true);

    }

    GCODE += chosenPrinter.endCode;

    // // console.log('ExportedGCODE: ', GCODE);

    var blob = new Blob([GCODE], {type: 'text/plain'});
    var d = new Date();
    saveAs(blob, 'joinery_print_'+d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+'_'+d.getHours()+'.'+d.getMinutes()+'.'+d.getSeconds()+'.gcode');
    refreshShapeDisplay();
    setMessage('<b>GCODE Exported</b>', '#444');

    var printShapes = [...addedOutputs];
    var printObj = {relevantShapes:addedShapes, printedThreads:printShapes, printJobs:addedPrintJobs, fabricated:false, gCodeBlob:blob, gcodeString:GCODE};
    return printObj;
}



// Combination of printed needle and thread
function addGCodePartsCGlobal(outString, params, placeList, commandObjs, depthAdjustment, reverse=false) {
	// // console.log({MSG:"Adding GCode", commandObj:commandObj, depthAdjustment:depthAdjustment, placeList:placeList, params:params});
	// // console.log("outString: " + outString.length);

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
	// // console.log("outStringAdded: " + outString.length);
	return outString;
} 

function addGCodePartGlobal(outString, params, placeList, commandObj, depthAdjustment, reverse=false, memoryList=[], memoryObj={}) {
	var connectionMemoryList = [];
	// // console.log({MSG:"Adding GCode", commandObj:commandObj, depthAdjustment:depthAdjustment, placeList:placeList, params:params});
	// // console.log("outString: " + outString.length);
	var lastPlace = [];
	var patternIndex = 0;
	let placeCounter = 0;
	// for (let i = -5; i < 5; i++) { 
	// 	// console.log(mod(i, commandObj.pattern.length));
	// }

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
	// // console.log("outStringAdded: " + outString.length);
	return outString;
} 