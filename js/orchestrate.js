
function createOrderList(prints, shapes, shapeIDs) {
    var handledPrints = [];
    var handledShapes = [];

    // console.log(log({prints:prints, shapes:shapes, shapeIDs:shapeIDs});
    var remainingShapeIDs = [...shapeIDs];
    var remainingPrints = [...prints];
    var orderList = [];
	var flatList = [];
	var counter = 0;
    
    // console.log(log({remainingPrints:remainingPrints, remainingShapeIDs:remainingShapeIDs});
    

    // let three = 0;

    while (handledPrints.length < remainingPrints.length) {
    // while (three < 3) {
        // three+=1;
        var currentObj = {};
        var nextShapeID = -1;

        // select hubs first --> cut shape with most connections first
        var maxCount = 0;
        for (let shapeID of remainingShapeIDs) {
            // Count occurrrences in prints
            var usedCount = 0;
            for (let print of remainingPrints) {
                if (print.relevantShapes.includes(shapeID)) usedCount++;
            }
            if (usedCount >= maxCount) {
                maxCount = usedCount;
                nextShapeID = shapeID;
            }
        }

        // console.log(log({nextShapeID:nextShapeID});

        // mark shape handled
        for (let shape of shapes) {
            // console.log(log({shape:shape, shapeID:shape.ID});
            if (shape.ID == nextShapeID) {
                // console.log(log({status:"FoundShape"});
                // currentObj.parentShapes.push(shape);
                currentObj.parentShape = shape;
                handledShapes.push(shape.ID);
                var index = remainingShapeIDs.indexOf(shape.ID);
                // console.log(log({index:index});
                if (index !== -1) {
                    remainingShapeIDs.splice(index, 1);
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

        // console.log(log({handledShapes:handledShapes, remainingShapeIDs:remainingShapeIDs});

        currentObj.childPrints = [];
        for (let printIndex = remainingPrints.length-1; printIndex >= 0; printIndex--) {
            let good = true;
            for (let relShape of remainingPrints[printIndex].relevantShapes) {
                if (handledShapes.indexOf(relShape.ID) == -1) {
                    good = false; 
                    // console.log(log({Status:"Print can not be added yet, lasershape not handled", print:remainingPrints[printIndex]});
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
                    // // console.log(log({relevant:relevant});
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

    // console.log(log({orderList:orderList, flatList:flatList});
    return [orderList, flatList];
}


function generateFabricationOrder(prints, laserObjects, allShapeIDs, svgContent) {
    var [tempO, tempF] = createOrderList(prints, laserObjects, allShapeIDs);
    order = tempO;
    flat = tempF;
    return {order:order, flattened:flat};
}