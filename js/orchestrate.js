
function createOrderList(prints, shapes, shapeIDs) {
    var handledPrints = [];
    var handledShapes = [];

    console.log({prints:prints, shapes:shapes, shapeIDs:shapeIDs});
    var remainingShapeIDs = [...shapeIDs];
    var remainingPrints = [...prints];
    var orderList = [];
	var flatList = [];
	var counter = 0;
    
    console.log({remainingPrints:remainingPrints, remainingShapeIDs:remainingShapeIDs});
    

    // let three = 0;

    while (handledPrints.length < remainingPrints.length) {
    // while (three < 3) {
        // three+=1;
        var currentObj = {};
        var nextShapeID = -1;

        // select hubs first --> cut shape with most connections first
        var maxCount = 0;
        // First, select shape with most connections
        for (let shapeID of remainingShapeIDs) {
            // Count occurrrences of shape in prints
            var usedCount = 0;
            for (let print of remainingPrints) {
                for (let relShape of print.relevantShapes) {
                    if (relShape.ID == shapeID) {
                        usedCount++;
                        break;
                    }
                }
                console.log({shapeID:shapeID, relevantShapes:print.relevantShapes, remainingPrints:remainingPrints});
            }
            if (usedCount >= maxCount) {
                maxCount = usedCount;
                nextShapeID = shapeID;
            }
            console.log({maxCount:maxCount, nextShapeID:nextShapeID});
        }

        console.log({nextShapeID:nextShapeID});

        if (nextShapeID === -1) {
            console.error("No shape selected. Possible infinite loop.");
            break;
        }

        // mark shape handled
        for (let shape of shapes) {
            console.log({shape:shape, shapeID:shape.ID});
            if (shape.ID == nextShapeID) {
                console.log({status:"FoundShape"});
                // currentObj.parentShapes.push(shape);
                currentObj.parentShape = shape;
                if (!handledShapes.includes(shape.ID)) {
                    handledShapes.push(shape.ID);
                }
                var index = remainingShapeIDs.indexOf(''+shape.ID);
                console.log({index:index});
                if (index !== -1) {
                    remainingShapeIDs.splice(index, 1);
                } else {
                    console.error("Shape not found in remainingShapeIDs");
                }
				const typeObj = {detail:0, string:"Cut"};
				const stepNr = counter + 0;
				counter += 1;
                var imageDataList = [shape.imageData]
				var flatObj = {listID:stepNr, type:typeObj, imageDatas:imageDataList, shape:shape};
				flatList.push(flatObj);
                break;
            }
        }

        console.log({handledShapes:handledShapes, remainingShapeIDs:remainingShapeIDs});

        // Add prints that can be handled given the handled shapes and add it to the current fabrication-order-object
        currentObj.childPrints = [];
        for (let printIndex = remainingPrints.length-1; printIndex >= 0; printIndex--) {
            let good = true;
            for (let relShape of remainingPrints[printIndex].relevantShapes) {
                if (handledShapes.indexOf(parseInt(relShape.ID)) == -1) {
                    good = false; 
                    console.log({Status:"Print can not be added yet, lasershape not handled", print:remainingPrints[printIndex]});
                    break;
                }
            }
            if (good) {
                var printRef = remainingPrints[printIndex];
                currentObj.childPrints.push(remainingPrints[printIndex]);
                handledPrints.push(remainingPrints[printIndex]);
                var index = remainingPrints.indexOf(remainingPrints[printIndex]);
				var theImageData = remainingPrints[printIndex].imageData;
                var imageDatas = [theImageData];
				for (let relevant of remainingPrints[printIndex].relevantShapes) {
                    console.log({relevant:relevant});
                    // imageDatas.push(relevant.shape.imageData); // Don't use raw shape images, use custom images with parts highlighted
                }
                for (let img of remainingPrints[printIndex].shapeImages) {
                    imageDatas.push(img);
                }
                var theRelevantShapes = remainingPrints[printIndex].relevantShapes;
                if (index !== -1) {
                    remainingPrints.splice(index, 1);
                }
				const typeObj = {detail:1, string:"Print"};
				const stepNr = counter + 0;
				counter += 1;
				var flatObj = {listID:stepNr, type:typeObj, imageDatas:imageDatas, parentShape:currentObj.parentShape, relevantShapes:theRelevantShapes, print:printRef};
				flatList.push(flatObj);
            }
        }
        orderList.push(currentObj);
    }

    console.log({orderList:orderList, flatList:flatList});
    return [orderList, flatList];
}


function generateFabricationOrder(prints, laserObjects, allShapeIDs, svgContent) {
    console.log({prints:prints, laserObjects:laserObjects, allShapeIDs:allShapeIDs});
    var [tempO, tempF] = createOrderList(prints, laserObjects, allShapeIDs);
    order = tempO;
    flat = tempF;
    return {order:order, flattened:flat};
}