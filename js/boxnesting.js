function minimizeBB(paperItem, margin) {
    console.log('paperItem: ', paperItem);
    // Align entire path width-wise (printing build plate left/right-wise)
    let rotationDegs = 10;
    let fullCircle = 0;
    let smallestBB = { deg: 0, area: Infinity };
    let rotP = new Point(paperItem.strokeBounds.x, paperItem.strokeBounds.y);
    while (fullCircle < 360) {
        // pathsGroup.rotate(rotationDegs, rotP);
        // for (let onePath of copyPaths) {
        // 	onePath.rotate(rotationDegs);
        // }
        // copyPath.rotate(rotationDegs);
        paperItem.rotate(rotationDegs, rotP);
        fullCircle += rotationDegs;
        if ((paperItem.strokeBounds.width * paperItem.strokeBounds.height) < smallestBB.area) {
            smallestBB.area = (paperItem.strokeBounds.width * paperItem.strokeBounds.height);
            smallestBB.deg = fullCircle;
        }
    }

    if (smallestBB.deg != 0) {
        // pathsGroup.rotate(smallestBB.deg, rotP);
        // for (let onePath of copyPaths) {
        // 	onePath.rotate(longestW.deg);
        // }
        // copyPath.rotate(longestW.deg);
        paperItem.rotate(smallestBB.deg, rotP);
    }
    var box = { w: paperItem.strokeBounds.width + margin, h: paperItem.strokeBounds.height + margin, paperItem: paperItem };
    return box;
}

function packboxes(boxes, inSpace) {
    // calculate total box area and maximum box width
    let area = 0;
    let maxWidth = 0;
    for (const box of boxes) {
        console.log('box: ', box);
        area += box.w * box.h;
        maxWidth = Math.max(maxWidth, box.w);
    }

    // sort the boxes for insertion by height, descending
    boxes.sort((a, b) => b.h - a.h);

    // aim for a squarish resulting container,
    // slightly adjusted for sub-100% space utilization
    const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth);

    // start with a single empty space, unbounded at the bottom
    // const spaces = [{x: 0, y: 0, w: startWidth, h: Infinity}];
    const spaces = inSpace;
    const packed = [];

    for (const box of boxes) {
        // look through spaces backwards so that we check smaller spaces first
        for (let i = spaces.length - 1; i >= 0; i--) {
            const space = spaces[i];

            // look for empty spaces that can accommodate the current box
            if (box.w > space.w || box.h > space.h) continue;

            packed.push(Object.assign({}, box, { x: space.x, y: space.y }));

            if (box.w === space.w && box.h === space.h) {
                // space matches the box exactly; remove it
                const last = spaces.pop();
                if (i < spaces.length) spaces[i] = last;

            } else if (box.h === space.h) {
                space.x += box.w;
                space.w -= box.w;

            } else if (box.w === space.w) {
                space.y += box.h;
                space.h -= box.h;

            } else {
                spaces.push({
                    x: space.x + box.w,
                    y: space.y,
                    w: space.w - box.w,
                    h: box.h
                });
                space.y += box.h;
                space.h -= box.h;
            }
            break;
        }
    }
    return { packed, spaces };
}