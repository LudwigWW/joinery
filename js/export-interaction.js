var cursorPt;
var pcursorPt;
var mousePosition;
var moving = false;
var tolerance = 3;
var insideMenu = false;
var export_ready = false;
var initialized = false;
var insideContextMenu = false;
var order;
var flat;
// var prints;
// var laserObjects;
// var allShapeIDs;

var currentBucket = -1;
var currentCut = 0;
var currentPrint = 0;
let currentCutObj = null;
let currentPrintObj = null;

let switchMoveDuration;

window.onbeforeunload = null;

window.addEventListener('beforeunload', function(event) {
    delete event['returnValue'];
});

// window.onbeforeunload = function() {
//     // return "Have you finished fabricating the project?";
// };

// window.addEventListener('beforeunload', function(event) {
// 	event.preventDefault();
// 	event.returnValue = '';
// });


function init() {
	console.log({jobBucketsByShape:window.jobBucketsByShape});
    console.log({images:window.imageList, myVar:window.myVar});

	switchMoveDuration = window.switchMoveDuration;

	jobBucketsByShape = window.jobBucketsByShape;
    // var query = window.location.search.substring(1);
    // var qs = parse_query_string(query);
    // console.log({query:query, qs:qs});
	if (!export_ready) {
		initButtons();
        // var [tempO, tempF] = createOrderList(window.prints, window.laserObjects, window.allShapeIDs);
		order = window.order; //tempO;
		flat = window.flat; //tempF
	}
	// printingCommands = getJSONs("test.json");
    paper.install(window);
	cursorPt = new Point(-1, -1);
	pcursorPt = new Point(-1, -1);
	mousePosition = new Point(-1, -1);
	export_ready = true;

    //$("#root").append($("<li>").html("Scooter"));

	// Recursive List
    // if (order.length > 0) {
    //     var firstStep = order[0];
    //     var steps = 0;
    //     $("#root").append(addStepsHTML(order, steps));
    // }

	// Flat List
	if (flat.length > 0) {
        $("#flatListContainer").append(addStepsHTML(flat));
    }

	// Buckets
	if (jobBucketsByShape.length > 0) {
		updateNextStep();

		$("#bucketListContainer").append(addBucketsHTML(jobBucketsByShape));
	}
	
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

function initButtons() {
	$('#export1').change(function() {
		if (this.files.length) {
			var file = this.files[0];
			var reader = new FileReader();
			var filename = file.name;
			var ext = filename.split('.');
			var name = ext[0];
			if (ext[ext.length-1]=='svg' || ext[ext.length-1]=='SVG') {
				reader.readAsText(file);
				SVGprocessed = false;
				$(reader).on('load', processSVG);
			} else {
				setMessage('<b>Invalid SVG</b>', '#F80');
			}
		} else {

		} 
	});

    $('#export2').change(function(e) {
        console.log({testE:e});
		if (this.files.length) {
			var file = this.files[0];
			var reader = new FileReader();
			var filename = file.name;
			var ext = filename.split('.');
			var name = ext[0];
			if (ext[ext.length-1]=='svg' || ext[ext.length-1]=='SVG') {
				reader.readAsText(file);
				SVGprocessed = false;
				$(reader).on('load', processSVG);
			} else {
				setMessage('<b>Invalid SVG</b>', '#F80');
			}
		} else {

		} 
	});
}

function refreshPage() {
	
	// reset container
	$("#flatListContainer").empty();
	if (flat.length > 0) {
        $("#flatListContainer").append(addStepsHTML(flat));
    }

	// Buckets
	$("#bucketListContainer").empty();
	if (jobBucketsByShape.length > 0) {
		updateNextStep();
		$("#bucketListContainer").append(addBucketsHTML(jobBucketsByShape));
	}
	
}

function updateNextStep() {
	let lowestCutOrder = Infinity;
	let lowestPrintStep = Infinity;
	for (let bucket of jobBucketsByShape) {
		let lowestCutObj = null;
		for (let cutObj of bucket.cutObjs) {
			if (!cutObj.fabricated && cutObj.cutOrder >= 0 && cutObj.cutOrder < lowestCutOrder) {
				lowestCutOrder = cutObj.cutOrder;
				lowestCutObj = cutObj;
			}
		}
		if (lowestCutObj) {
			// Do something with the lowestCutObj
			currentCutObj = lowestCutObj;
			currentCut = lowestCutOrder;
		}

		
		for (let printSet of bucket.printSets) {
			let unfabricatedPrint = false;
			let tempSinglePrint = null;
			for (let print of printSet.singlePrints) {
				if (!print.fabricated) {
					unfabricatedPrint = true;
					tempSinglePrint = print;
					break;
				}
			}

			if (unfabricatedPrint && printSet.printStep < lowestPrintStep) {
				lowestPrintStep = printSet.printStep;
				currentPrint = lowestPrintStep;
				currentPrintObj = tempSinglePrint;
				// Also set the current bucket to this bucket
				currentBucket = jobBucketsByShape.indexOf(bucket);
			}
		}
	}

	for (let bucket of jobBucketsByShape) {
		let allFabricated = true;
		for (let cutObj of bucket.cutObjs) {
			if (!cutObj.fabricated) {
				allFabricated = false;
				break;
			}
		}
		if (!allFabricated) {
			continue;
		}
		for (let printSet of bucket.printSets) {
			for (let print of printSet.singlePrints) {
				if (!print.fabricated) {
					allFabricated = false;
					break;
				}
			}
			if (!allFabricated) {
				break;
			}
		}
		if (allFabricated) {
			bucket.fabricated = true;
		}
	}
	console.log({currentCut:currentCut, currentPrint:currentPrint, currentBucket:currentBucket});
	console.log({currentCutObj:currentCutObj, currentPrintObj:currentPrintObj});
}

// function createOrderList(prints, shapes, shapeIDs) {
//     var handledPrints = [];
//     var handledShapes = [];

//     console.log({prints:prints, shapes:shapes, shapeIDs:shapeIDs});
//     var remainingShapeIDs = [...shapeIDs];
//     var remainingPrints = [...prints];
//     var orderList = [];
// 	var flatList = [];
// 	var counter = 0;
    
//     console.log({remainingPrints:remainingPrints, remainingShapeIDs:remainingShapeIDs});
    

//     // let three = 0;

//     while (handledPrints.length < remainingPrints.length) {
//     // while (three < 3) {
//         // three+=1;
//         var currentObj = {};
//         var nextShapeID = -1;

//         // select hubs first --> cut shape with most connections first
//         var maxCount = 0;
//         for (let shapeID of remainingShapeIDs) {
//             // Count occurrrences in prints
//             var usedCount = 0;
//             for (let print of remainingPrints) {
//                 if (print.relevantShapes.includes(shapeID)) usedCount++;
//             }
//             if (usedCount >= maxCount) {
//                 maxCount = usedCount;
//                 nextShapeID = shapeID;
//             }
//         }

//         console.log({nextShapeID:nextShapeID});

//         // mark shape handled
//         for (let shape of shapes) {
//             console.log({shape:shape, shapeID:shape.ID});
//             if (shape.ID == nextShapeID) {
//                 console.log({status:"FoundShape"});
//                 currentObj.parentShape = shape;
//                 handledShapes.push(shape.ID);
//                 var index = remainingShapeIDs.indexOf(shape.ID);
//                 console.log({index:index});
//                 if (index !== -1) {
//                     remainingShapeIDs.splice(index, 1);
//                 }
// 				const typeObj = {detail:0, string:"Cut"};
// 				const stepNr = counter + 0;
// 				counter += 1;
// 				var flatObj = {listID:stepNr, type:typeObj, imageData:shape.imageData};
// 				flatList.push(flatObj);
//                 break;
//             }
//         }

//         console.log({handledShapes:handledShapes, remainingShapeIDs:remainingShapeIDs});

//         currentObj.childPrints = [];
//         for (let printIndex = remainingPrints.length-1; printIndex >= 0; printIndex--) {
//             let good = true;
//             for (let relShape of remainingPrints[printIndex].relevantShapes) {
//                 if (handledShapes.indexOf(relShape.ID) == -1) {
//                     good = false; 
//                     console.log({Status:"Print can not be added yet, lasershape not handled", print:remainingPrints[printIndex]});
//                     break;
//                 }
//             }
//             if (good) {
//                 currentObj.childPrints.push(remainingPrints[printIndex]);
//                 handledPrints.push(remainingPrints[printIndex]);
//                 var index = remainingPrints.indexOf(remainingPrints[printIndex]);
// 				var theImageData = remainingPrints[printIndex].imageData;
//                 if (index !== -1) {
//                     remainingPrints.splice(index, 1);
//                 }
// 				const typeObj = {detail:1, string:"Print"};
// 				const stepNr = counter + 0;
// 				counter += 1;
// 				var flatObj = {listID:stepNr, type:typeObj, imageData:theImageData};
// 				flatList.push(flatObj);
//             }
//         }
//         orderList.push(currentObj);
//     }

//     console.log({orderList:orderList, flatList:flatList});
//     return [orderList, flatList];
// }

function makeImage(imageData, width=200, height=150) {
    var blob = new Blob([imageData.svgString], {type: 'image/svg+xml'});

    const url = URL.createObjectURL(blob);
    const image = document.createElement('img');
    image.addEventListener('load', () => URL.revokeObjectURL(url), {once: true});
    image.src = url;
    // image.width = width;
	image.style.width = "100%";
    image.style.maxWidth = width.toString()+"px";
	image.style.height = "100%";
    image.style.maxHeight = height.toString()+"px";
    $("#TestDiv").append(image);
    return image.outerHTML;
}

function makeButton(id, text, onclick, groupOnclick = null) {
	let htmlString = '<div class="buttonExport"><label for="export';
	htmlString += id.toString() + '" class="button2" onclick="' + onclick + '">' + text + '</label></div>';
	if (groupOnclick != null) {
		//htmlString += '<span class="extraHigh">';
		htmlString += '<div class="buttonExport"><label for="groupExport';
		htmlString += id.toString() + '" class="button2" onclick="' + groupOnclick + '">' + "Group DL" + '</label></div>';
		htmlString += '<input id="'+ id.toString() + '_groupDL" class="checkbox" type="checkbox">';
	}  
	
	return htmlString;
	return +id.toString()+'" class="button2" onclick="'+onclick+'">'+text+'</label></div> <span class="extraHigh"> <input id="dl'+id.toString()+'" class="checkbox" type="checkbox"> <br> download</span>';
}

function makeColorStyle(status) {
	var html = '';
	if (status == 1) {
		html += ' style="border-color: green;"';
	} else if (status == 2){
		html += ' style="border-color: lightblue;"';
	} else {
		html += ' style="border-color: lightgrey;"';
	}
	return html;
}


function addListBucketBox(bucket, status=0) {
	var id = bucket.bucketOrder;
	let html = '<div id="step'+id.toString()+'box" class="bucketholder"';
	

	html += makeColorStyle(status);

	html += '> ';
	html += '<span>Group '+(id+1).toString()+':</span> '
	// html += '<input id="done'+id.toString()+'" class="checkbox" type="checkbox"'
	// if (completed) {
	// 	html += ' checked';
	// } 
	// html += '> '
	// html += '<span id="type'+id.toString()+'">'+ type.string +'</span> '
	// html += '<img src="';
	
	// switch(type.detail) {
	// 	case 0:
	// 		html += '../images/holeIcon2.svg';
	// 		break;
	// 	case 1:
	// 		html += '../images/dullIcon.svg';
	// 		break;
	// 	default:
	// 		html += '../images/needleIcon.svg';
	// }

	// html += '" style="width:16px">';


	// html += makeButton(id, "Download", 'downloadFile(\'exp'+id.toString()+'\')');
	html += '<br />';
	
	html += '<div class="cutsHolder">';
	for (let cutObj of bucket.cutObjs) {
		let showNr = false;
		if (cutObj.cutOrder > 0) {
			showNr = true;
		}
		var cutStatus = 0;
		if (cutObj.fabricated) {
			cutStatus = 2;
		} else if (currentCut == cutObj.cutOrder) {
			cutStatus = 1;
		}

		html += addParallelCuts(cutObj, showNr, cutStatus, false);
	}
	html += '</div>';

	html += '<div class="hruleHolder">';
	html += '<hr />';
	html += '</div>';
	html += '<div class="printsHolder">';
	for (let set of bucket.printSets) {
		// for (let printJob of job) {
		// 	console.log({printJob:printJob});
		let printSetsId = set.printStep;
			for (let print of set.singlePrints) {
				let printStatus = 0;
				if (print.fabricated) {
					printStatus = 2;
				} else if (currentPrint == printSetsId) {
					printStatus = 1;
				}
				html += addParallelJobs(print, printSetsId, printStatus, false);
			}
		// }
	}
	html += '</div>';
	// console.log(imageDatas.length)
	// console.log(imageDatas)
	// if (imageDatas.length > 0) {
	// 	for (let imageData of imageDatas) {
	// 		console.log(imageData);
	// 		let image = makeImage(imageData);
	// 		html += image;
	// 	}
	// }
	html += '</div>';
	return html;
}


function addListBox(id, type, imageDatas, completed) {
	let html = '<div id="step'+id.toString()+'box" class="stepholder" style="border-color: red;"> ';
	html += '<span>Step '+id.toString()+':</span> <input id="done'+id.toString()+'" class="checkbox" type="checkbox"'
	if (completed) {
		html += ' checked';
	} 
	html += '> <span id="type'+id.toString()+'">'+ type.string +'</span> <img src="';
	
	switch(type.detail) {
		case 0:
			html += '../images/holeIcon2.svg';
			break;
		case 1:
			html += '../images/dullIcon.svg';
			break;
		default:
			html += '../images/needleIcon.svg';
	}

	html += '" style="width:16px">';
	html += makeButton(id, "Download", 'downloadFile(\'exp'+id.toString()+'\')');
	html += '<br />';
	if (imageDatas.length > 0) {
		for (let imageData of imageDatas) {
			let imageType = '';
			if (imageData.imageType) imageType = imageData.imageType;
			html += '<span>'+imageType+'</span><br />';
			let image = makeImage(imageData);
			html += image;
			html += '<br />';
		}
	}
	html += '</div>';
	return html;
}


function addStepsHTML(flatList) {
	var html = "";
    if (flatList.length > 0) {
		for (let listItem of flatList) {
			html += addListBox(listItem.listID, listItem.type, listItem.imageDatas, false);
			html += '<br />';
		}
	}
	return html;
}

function addBucketsHTML(buckets) {
	var html = "";
    if (buckets.length > 0) {
		for (var i = 0; i < buckets.length; i++) {
			var bucket = buckets[i];
			var status = 0;
			if (bucket.fabricated) {
				status = 2;
			}
			else if (currentBucket == i) {
				status = 1;
			}  
			html += addListBucketBox(bucket, status);
			html += '<br />';
		}
	}
	return html;
	if (buckets.length > 0) {
		var html = '';
		for (var i = 0; i < buckets.length; i++) {
			var bucket = buckets[i];
			var stepNumber = i + 1;
			var headerColor = '';
			if (bucket.fabricated) {
				headerColor = 'text-muted';
			} else if (bucket.selected) {
				headerColor = 'text-success';
			} else {
				headerColor = 'text-warning';
			}
			html += '<div class="container">';
			html += '<h4 class="' + headerColor + '">Step ' + stepNumber + '</h4>';
			html += '<div class="row">';
			for (var j = 0; j < bucket.printSets.length; j++) {
				var set = bucket.printSets[j];
				html += addParallelJobs(set);
			}
			html += '</div>';
			html += '</div>';
		}
		return html;
	} else return "";
}

function addParallelCuts(cutObj, showNr, status, completed=false) {
	let id = cutObj.cutOrder;
	let type = cutObj.type;
	let imageDatas = cutObj.imageDatas;
	let html = '<div id="step'+id.toString()+'box" class="stepholder"'
	html += makeColorStyle(status);
	html += '> ';
	
	let fabricWidth = Math.ceil((cutObj.cutSVG.width + 35) / 10); 
	let fabricHeight = Math.ceil((cutObj.cutSVG.height + 35) / 10); 
	let fabricSize = "~" + fabricWidth + "x" + fabricHeight + "cm ";

	html += '<span>' + fabricSize + 'FABRIC CUT C'+id.toString()+':</span> '
	// checkbox
	// html += '<input id="done'+id.toString()+'" class="checkbox" type="checkbox"'
	// if (completed) {
	// 	html += ' checked';
	// } 
	// html += '> ';

	html += '<span id="type'+id.toString()+'">'+ type.string +'</span> <img src="';
	
	switch(type.detail) {
		case 0:
			html += '../images/holeIcon2.svg';
			break;
		case 1:
			html += '../images/dullIcon.svg';
			break;
		default:
			html += '../images/needleIcon.svg';
	}

	html += '" style="width:16px">';
	html += makeButton(id, "Download", 'downloadFile(\'cut_'+id.toString()+'\')');
	html += '<br />';
	if (imageDatas.length > 0) {
		for (let imageData of imageDatas) {
			let imageType = '';
			if (imageData.imageType) imageType = imageData.imageType;
			html += '<span>'+imageType+'</span><br />';
			let image = makeImage(imageData);
			html += image;
			html += '<br />';
		}
	}
	html += '</div>';
	return html;
}


function addParallelJobs(print, id, status, completed=false) {
	let type = print.type;
	let imageDatas = print.imageDatas;
	let html = '<div id="step'+id.toString()+'box" class="stepholder"';
	
	html += makeColorStyle(status);

	html += '> ';
	html += '<span>Seam S'+id.toString()+':</span> ';
	// html += '<input id="done'+id.toString()+'" class="checkbox" type="checkbox"'
	// if (completed) {
	// 	html += ' checked';
	// } 
	// html += '>';
	html += ' <span id="type'+id.toString()+'">'+ type.string +'</span> <img src="';
	
	switch(type.detail) {
		case 0:
			html += '../images/holeIcon2.svg';
			break;
		case 1:
			html += '../images/dullIcon.svg';
			break;
		default:
			html += '../images/needleIcon.svg';
	}

	html += '" style="width:16px">';
	html += makeButton(id, "Download", 'downloadFile(\'print_'+id.toString()+'\')', 'groupExport(\'print_'+id.toString()+'\')');
	html += '<br />';
	if (imageDatas.length > 0) {
		for (let imageData of imageDatas) {
			let imageType = '';
			if (imageData.imageType) imageType = imageData.imageType;
			html += '<span>'+imageType+'</span><br />';
			let image = makeImage(imageData);
			html += image;
			html += '<br />';
		}
	}

	if (print.shapeImages.length > 0) {
		for (let imageData of print.shapeImages) {
			let imageType = '';
			if (imageData.imageType) imageType = imageData.imageType;
			html += '<span>'+imageType+'</span><br />';
			let image = makeImage(imageData);
			html += image;
			html += '<br />';
		}
	}

	html += '</div>';
	return html;
}

function flattenList(orderList, stepCounter, outList) {
	if (orderList.length > 0) {
		var stepNr = stepCounter + 0;
		const typeObj = {detail:0, string:"Cut"};
		outList.append({listID:stepNr, type:typeObj, image:orderList[0].parentShape.imageData[0]});
        stepCounter += 1;
        if (orderList.length > 1 || orderList[0].childPrints.length > 0) {
            html += "<ul>\n";
            for (let childPrint of orderList[0].childPrints) {
                console.log({childPrint:childPrint, status:"makingPrintStepHTML"});
                html += "  <li>\n\n";

                html += "Step "+stepCounter.toString()+"</br></br></br></br></br>";
                stepCounter += 1;
                html += buttonHTML;

                html += "  </li>\n"

            }

            if (orderList.length > 1) {

                // Call addSteps again
            }



            html += "</ul>\n";
        }
        // html += "<summary>Step " +stepCounter.toString() + "</br></br></br></br></br>"+ buttonHTML +"</summary>\n";
        
        // html += "  <li>\n    <details>\n      <summary>More steps</summary>";
        
        
        /*<!-- <summary>Giant planets</summary>
        <ul>
        <li>
            <details>
            <summary>Gas giants</summary>
            <ul>
                <li>Jupiter</li>
                <li>Saturn</li>
            </ul>
            </details>
        </li>
        <li>
            <details>
            <summary>Ice giants</summary>
            <ul>
                <li>Uranus</li>
                <li>Neptune</li>
            </ul>
            </details>
        </li>
        </ul> -->*/
        return html;
    } 
    else return "";
}

function addStepsHTMLRec(orderList, stepCounter) {
    if (orderList.length > 0) {
        image = makeImage(orderList[0].parentShape.imageData);

            
        const buttonHTML = '<div class="buttonExport"> \n        <label for="export2" class="button2" onclick="fabricateNow()" style="width:120px; margin-left:5px">Start printing</label>\n        \n    </div>\n        <div class="buttonExport">\n		<label for="export1" class="button2" onclick="downloadFile(\'exp1\')" style="width:120px; margin-left:155px; ">Download printing code</label>\n		\n	</div>'
        var html = "<summary>Step "+stepCounter.toString()+"</br>"+image+"</br></br></br></br>"+buttonHTML+"</summary>";
        stepCounter += 1;
        if (orderList.length > 1 || orderList[0].childPrints.length > 0) {
            html += "<ul>\n";
            for (let childPrint of orderList[0].childPrints) {
                console.log({childPrint:childPrint, status:"makingPrintStepHTML"});
                html += "  <li>\n\n";

                html += "Step "+stepCounter.toString()+"</br></br></br></br></br>";
                stepCounter += 1;
                html += buttonHTML;

                html += "  </li>\n"

            }

            if (orderList.length > 1) {

                // Call addSteps again
            }



            html += "</ul>\n";
        }
        // html += "<summary>Step " +stepCounter.toString() + "</br></br></br></br></br>"+ buttonHTML +"</summary>\n";
        
        // html += "  <li>\n    <details>\n      <summary>More steps</summary>";
        
        
        /*<!-- <summary>Giant planets</summary>
        <ul>
        <li>
            <details>
            <summary>Gas giants</summary>
            <ul>
                <li>Jupiter</li>
                <li>Saturn</li>
            </ul>
            </details>
        </li>
        <li>
            <details>
            <summary>Ice giants</summary>
            <ul>
                <li>Uranus</li>
                <li>Neptune</li>
            </ul>
            </details>
        </li>
        </ul> -->*/
        return html;
    } 
    else return "";
}


document.onmousemove = function(e){
	// if (initialized) {
	// 	mousePosition = new Point(e.pageX, e.pageY - $(window).scrollTop());
	// 	pcursorPt.x = cursorPt.x;
	// 	pcursorPt.y = cursorPt.y;
	// 	cursorPt = paper.view.viewToProject(mousePosition);
	// 	cursorIcon.position = cursorPt;
	// 	if (insideMenu) {
	// 		cursorIcon.strokeColor = new Color(0, 0);
	// 	} else {
	// 		cursorIcon.strokeColor = '#000';
	// 	}
	// 	highlightShapePath();
	// 	switch(mode) {
	// 		case 'update':
	// 			highlightShapeBounds();
	// 			break;
	// 		case 'arrange':
	// 			highlightShapeBounds();
	// 			if (shapeSelected > -1 && isMouseDown) {
	// 				moving = true;
	// 				$('body').css('cursor', 'move');
	// 				var tV = cursorPt.subtract(pcursorPt);
	// 				shape[shapeSelected].position = shape[shapeSelected].position.add(tV);
	// 			}
	// 			if (!isMouseDown) {
	// 				moving = false;
	// 			}
	// 			break;
	// 		case 'remove':
	// 			if (shape.length > 0) {
	// 				highlightShapeBounds();
	// 			}
	// 			break;
	// 		case 'set':
	// 			//highlightShapePath();
	// 			break;
	// 		case 'reverse':
	// 			//highlightShapePath();
	// 			break;
	// 		case 'flip':
	// 			//highlightShapePath();
	// 			break;
	// 		case 'swap':
	// 			//highlightShapePath();
	// 			break;
	// 		case 'pan':
	// 			if (isMouseDown) {
	// 				var tV = cursorPt.subtract(pcursorPt);
	// 				cursorIcon.position = cursorIcon.position.add(tV);
	// 				jointLines.position = jointLines.position.add(tV);
	// 				tempLines.position = tempLines.position.add(tV);
	// 				flipLines.position = flipLines.position.add(tV);
	// 				for (i in shape) {
	// 					shape[i].position = shape[i].position.add(tV);
	// 				}
	// 			}
	// 			break;
	// 	}
	// }
    mousePosition = new Point(e.pageX, e.pageY - $(window).scrollTop());
    // console.log({mousePosition:mousePosition});
}

function fabricateNow(e) {
    console.log({Fe:e});
}

function downloadFile(e) {
    console.log({e:e});
	// split by underscore
	var parts = e.split('_');
	var type = parts[0];
	var id = parts[1];
	if (type == 'print') {
		// Find print with id in jobBucketsByShape
		for (let bucket of jobBucketsByShape) {
			for (let set of bucket.printSets) {
				if (set.printStep == id) {

					for (let print of set.singlePrints) {
						// download job gcode
						var d = new Date();
						saveAs(print.gCodeBlob, 'joinery_print_'+d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+'_'+d.getHours()+'.'+d.getMinutes()+'.'+d.getSeconds()+'.gcode');
						print.fabricated = true;
					}
					set.fabricated = true;
				}
			}
		}
	} else if (type == 'cut') {
		// Find cut with id 
		for (let bucket of jobBucketsByShape) {
			for (let cut of bucket.cutObjs) {
				if (cut.cutOrder == id) {
					// download cut gcode
					var d = new Date();
					saveAs(cut.cutSVG.blob, 'joinery_cut_'+d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+'_'+d.getHours()+'.'+d.getMinutes()+'.'+d.getSeconds()+'.svg');
					cut.fabricated = true;
					console.log({cut:cut});
				}
			}
		}
	}

	// refresh page
	refreshPage();
}

function groupExport(e) {
    console.log({e:e});

	var checkedCheckboxes = [];
	$('#bucketListContainer input[type="checkbox"]:checked').each(function() {
		checkedCheckboxes.push($(this).attr('id')); // Get the ID of the checkbox
	});

	console.log({checkedCheckboxes:checkedCheckboxes});

	// Sort the checked checkboxes by their printStep numbers
	checkedCheckboxes.sort((a, b) => {
		const printStepA = parseInt(a.split('_')[0]);
		const printStepB = parseInt(b.split('_')[0]);
		return printStepA - printStepB;
	});

	var printSetsList = [];
	for (let checkbox of checkedCheckboxes) {
		var parts = checkbox.split('_');
		var id = parseInt(parts[0]);
		console.log({id:id});
		for (let bucket of jobBucketsByShape) {
			console.log({bucket:bucket});
			for (let set of bucket.printSets) {
				console.log({set:set});
				if (set.printStep === id) {
					console.log({printStep:set.printStep});
					printSetsList.push(set);
				}
			}
		}
	}

	console.log({printSetsList:printSetsList});
	console.log({chosenPrinter:chosenPrinter});
	console.log({shape:shape});

	let combinedPrints = exportPrintSets(printSetsList, chosenPrinter);

	console.log({combinedPrints:combinedPrints});

	for (let printFile of combinedPrints) {
		// download job gcode
		var d = new Date();
		saveAs(printFile.gCodeBlob, 'joinery_print_'+d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+'_'+d.getHours()+'.'+d.getMinutes()+'.'+d.getSeconds()+'.gcode');
	}

	// Update fabrication status
	for (let bucket of jobBucketsByShape) {
		for (let set of bucket.printSets) {
			for (let checkboxId of checkedCheckboxes) {
				var parts = checkboxId.split('_');
				var id = parseInt(parts[0]);
				if (set.printStep == id) {
					for (let print of set.singlePrints) {
						print.fabricated = true;
					}
					set.fabricated = true;
				}
			}
		}
	}
	// refresh page
	refreshPage();
}

$(document).bind("contextmenu", function (event) {
    if (initialized && !insideMenu) {
    	event.preventDefault();
    	
    	if (pathSelected.shape != -1 && pathSelected.path != -1 && !$('#contextMenu').hasClass('active')) {
    		$('#contextMenu').toggleClass('active');
    		$('#contextMenu').css({'top':mousePosition.y+'px', 'left':mousePosition.x+5+'px'});
    	} else if ($('#contextMenu').hasClass('active')) {
    		highlightShapePathContext();
    		if (pathSelected.shape != -1 && pathSelected.path != -1) {
    			$('#contextMenu').css({'top':mousePosition.y+'px', 'left':mousePosition.x+5+'px'});
    		} else {
    			$('#contextMenu').toggleClass('active');
    		}
    	}
	}
});

document.onclick = function(e) {
	if ($('#jointTypeDiv .dropdown .optionsDiv .dropdownOption.show').length > 0 && !insideDropdown) {
		$('#jointTypeDiv .dropdown .optionsDiv .dropdownOption').toggleClass('show');
	}
	// if (initialized && !insideMenu && !insideContextMenu && !$('#contextMenu').hasClass('active')) {
	// 	switch (e.which) {
	//         case 1:
	// 		    switch(mode) {
	// 		    	case 'update':
	// 		    		if (shapeSelected != -1) {
	// 		    			shapeToReplace = shapeSelected;
	// 		    			fileSelector.click();
	// 		    		}
	// 		    		mode = rememberMode;
	// 		    		$('#updateSVGDiv.active').toggleClass('active');
	// 		    		break;
	// 				case 'remove':
	// 					removeShape();
	// 					break;
	// 				case 'set':
	// 					shapePathClick();
	// 					break;
	// 				case 'reverse':
	// 					shapePathClick();
	// 					break;
	// 				case 'flip':
	// 					shapePathClick();
	// 					break;
	// 				case 'swap':
	// 					shapePathClick();
	// 					break;
	// 			}
	//             break;
	//         case 2:
	//             console.log('Middle Mouse button pressed.');
	//             break;
	//         default:
	//             console.log('You have a strange Mouse!');
	//     }
	// }
	if (!insideContextMenu) {
		$('#contextMenu.active').toggleClass('active');
	}
}

var isMouseDown = false;
document.onmousedown = function(e){
	if (initialized) {
		isMouseDown = true;
		switch(mode) {
			case 'pan':
				$('body').css('cursor', '-webkit-grabbing');
				break;
		}
	}
}
document.onmouseup = function(e){
	if (initialized) {
		isMouseDown = false;
		switch(mode) {
			case 'arrange':
				calProjectBounds();
				break;
			case 'pan':
				$('body').css('cursor', '-webkit-grab');
				break;
		}
	}
}

var scaleSensitivity = 0.0075;
var zoomSpeedLimit = 200;
var zoomThen = Date.now();
var zoomNow = Date.now();
document.onwheel = function(e) {
	if (initialized) {
		zoomNow = Date.now();
		if (!insideMenu && shape.length > 0) {
			cursorPt = paper.view.viewToProject(mousePosition);
			cursorIcon.position = cursorPt;
			var dir = e.deltaY<0 ? -1 : e.deltaY>0 ? 1 : 0;
			var oldScale = paperScale;
			zoomThen = (zoomNow - zoomThen) > zoomSpeedLimit ? zoomNow : zoomThen;
			var scaleFactor = 1 + (zoomNow - zoomThen)*dir*scaleSensitivity;
			scaleFactor = scaleFactor > 1.3 ? 1.3 : scaleFactor;
			scaleFactor = scaleFactor < 0.8 ? 0.8 : scaleFactor;
			paperScale = paperScale * scaleFactor;
			paper.view.zoom = paperScale;
			drawGrid();
			paper.project._needsUpdate = true;
    		paper.project.view.update();
		}
		zoomThen = Date.now();
	}
}

var rememberMode = '';
document.onkeyup = function(e) {
	if (initialized && !$("input,textarea").is(":focus")) {		
		var key = e.keyCode ? e.keyCode : e.which;
		if (key==32) { // space
			if (mode=='pan' && rememberMode!='pan') {
				mode = rememberMode;
				$('body').css('cursor', 'default');
				cursorIcon.strokeColor = '#000';
			}
		}
		if (!ctrlDown) {
			if (key==65) {  // 'a'
				arrangeClick();
			}
			if (key==82) {  // 'r'
				reverseClick();
			}
			if (key==83) {  // 's'
				setClick();
			}
			if (key==80) {  // 'p'
				panClick();
			}
			if (key==88) {  // 'x'
				removeClick();
			}
			if (key==70) {  // 'f'
				flipClick();
			}
			if (key==87) {  // 'w'
				swapClick();
			}

			if (key==79) {  // 'o'
				singlePathJointButton();
			}

			// if (key==67) { // 'c'
			// 	for (var i=0; i<joints.length; i++) {
			// 		for (j in joints[i]) {
			// 			if (j=='0' || j=='1') {
			// 				removeJoint(joints[i][j].shape, joints[i][j].path);
			// 			}
			// 		}
			// 	}
			// 	joints = [];
			// 	jointLines.removeChildren();
			// 	refreshShapeDisplay();
			// 	refreshJointList();
			// }
			
			// if (key==66) { // 'b'
			// 	console.log(shape);
			// 	console.log(joints);
			// }
		}
		
		if (ctrlDown) {
			/* if (key==83) {  // 's'
				setMessage('<b>Exporting SVG Please wait</b>', '#F80');
				exportProject();
			} */
			if (key==48) {
				zoomToFit();
			}
		}
		
		if (key==17) {
			ctrlDown = false;
		}

		if (key==16) {
			shiftDown = false;
			if (pasteJointProfile.bool) {
				$('#'+pasteJointProfile.id+' .title').css("background", "#BBB");
			}
			pasteJointProfile.bool = false;
		}
	} else if (initialized) {
		var key = e.keyCode ? e.keyCode : e.which;
		if (key==13) {
			for (j in jointProfileList) {
				var id = jointProfileList[j].profile;
				var idArray = id.split(' ');
				if ($("#joint_"+idArray[idArray.length-1]+" input").is(":focus")) {
					setJointValue("joint_"+idArray[idArray.length-1]);
				}
			}
		}
	}
}

function zoomToFit() {
	calProjectBounds();
	var projectW = projectBounds.maxX-projectBounds.minX;
	var projectH = projectBounds.maxY-projectBounds.minY;
	var tV = new Point(paper.view.center.x-projectBounds.x, paper.view.center.y-projectBounds.y);
	cursorIcon.position = cursorIcon.position.add(tV);
	jointLines.position = jointLines.position.add(tV);
	tempLines.position = tempLines.position.add(tV);
	flipLines.position = flipLines.position.add(tV);
	for (i in shape) {
		shape[i].position = shape[i].position.add(tV);
	}
	var aspectProj = projectW/projectH;
	var aspectView = (window.innerWidth-400)/window.innerHeight;
	if (aspectProj < aspectView) {
		var scaleFactor = (projectH*paperScale)/(0.8*window.innerHeight);
		paperScale = paperScale / scaleFactor;
		paper.view.zoom = paperScale;
	} else {
		var scaleFactor = (projectW*paperScale)/(0.8*(window.innerWidth-400));
		paperScale = paperScale / scaleFactor;
		paper.view.zoom = paperScale;
	}
	paper.project._needsUpdate = true;
	paper.project.view.update();
}

var ctrlDown = false;
var shiftDown = false;
document.onkeydown = function(e) {
	if (initialized) {
		var key = e.keyCode ? e.keyCode : e.which;
		if (key==32) { // space
			if (mode != 'pan') {
				rememberMode = mode;
				mode = 'pan';
				cursorIcon.strokeColor = new Color(0, 0);
				if (!isMouseDown) {
					$('body').css('cursor', '-webkit-grab');
				}
			}
		}
		if (key==17) {
			ctrlDown = true;
		}
		if (key==16) {
			shiftDown = true;
		}
	}
}

$( window ).resize(function() {
	if (initialized) {
		$('#paperCanvas').css({'width':window.innerWidth, 'height':window.innerHeight});
		$('#bgCanvas').attr({'width':window.innerWidth, 'height':window.innerHeight});
		paper.view.viewSize = new Size(window.innerWidth, window.innerHeight);
	}
	drawGrid();
});

$(document).bind('keydown', function(e) {
  if(e.ctrlKey && (e.which == 90)) {
    e.preventDefault();
  }
  if(e.ctrlKey && (e.which == 89)) {
    e.preventDefault();
  }
  if(e.ctrlKey && (e.which == 83)) {
    e.preventDefault();
  }
});