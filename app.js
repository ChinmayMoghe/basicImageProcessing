let imgData, originalPixels, filterCtx, currentPixels, srcImg;
/*Current values of filters stored here*/
const filterState = {
    redChannel: 0,
    greenChannel: 0,
    blueChannel: 0,
    brightness: 0,
    grayscale: 0
}

const colorOffsets = {
    redChannel: 0,
    greenChannel: 1,
    blueChannel: 2
}

const validateValues = (target, property, value) => {
    let isValid;
    if (property in target && value !== null) {
        if (typeof (value) === "boolean") {
            isValid = property === "grayscale" && target[property] !== value ? true : false;
        } else if (typeof (value) === "number") {
            const valueinRange = value >= -255 && value <= 255;
            isValid = property !== "grayscale" && target[property] !== value && valueinRange ? true : false;
        }
    }
    return isValid;
};

/**
 * Helper functions start
*/
const getIndex = (x, y) => {
    return ((x + y * srcImg.width) * 4);
};

/*return values between 0 to 255 only*/
const clamp = (channelValue) => {
    return Math.max(0, Math.min(channelValue, 255));
}
/*
 * Helper functions end
*/

/*Filter functions start*/
const addColor = (x, y, currentVal, offset) => {
    const index = getIndex(x, y) + offset;
    const currentValue = currentPixels[index];
    currentPixels[index] = clamp(currentValue + currentVal);
}
const addBrightness = (x, y, currentVal) => {
    addColor(x, y, currentVal, colorOffsets.redChannel);
    addColor(x, y, currentVal, colorOffsets.greenChannel);
    addColor(x, y, currentVal, colorOffsets.blueChannel);
}

const grayScaleImage = (x, y) => {
    const redIndex = getIndex(x, y) + colorOffsets.redChannel;
    const greenIndex = getIndex(x, y) + colorOffsets.greenChannel;
    const blueIndex = getIndex(x, y) + colorOffsets.blueChannel;

    const redVal = currentPixels[redIndex];
    const greenVal = currentPixels[greenIndex];
    const blueVal = currentPixels[blueIndex];

    const mean = (redVal + greenVal + blueVal) / 3;

    currentPixels[redIndex] = clamp(mean);
    currentPixels[greenIndex] = clamp(mean);
    currentPixels[blueIndex] = clamp(mean);

}
/*Filter functions end */
const getRedComponent = (pixelData) => {
    let pointCount = 0;
    const offset = 0;
    let redComponent = 0;
    for (let i = 0; i < srcImg.height; i++) {
        for (let j = 0; j < srcImg.width; j++) {
            redComponent += pixelData[getIndex(j, i)]
            pointCount += 1;
        }
    }
    return (redComponent / pointCount);
}
const commitChanges = () => {
    for (let i = 0; i < imgData.data.length; i++) {
        imgData.data[i] = currentPixels[i];
    }
    filterCtx.putImageData(imgData, 0, 0, 0, 0, srcImg.width, srcImg.height);
}

const runFilterPipeline = (target) => {
    currentPixels = originalPixels.slice();
    for (let i = 0; i < srcImg.height; i++) {
        for (let j = 0; j < srcImg.width; j++) {
            for (let channel in target) {
                const offset = colorOffsets[channel];
                const currentVal = filterState[channel];
                if (offset !== undefined) {
                    addColor(j, i, currentVal, offset);
                } else if (filterState.grayscale) {
                    grayScaleImage(j, i)
                } else {
                    addBrightness(j, i, currentVal);
                }
            }
        }
    }
    commitChanges();
}

const updateFilterValues = () => {
    for (const offset in filterState) {
        if (offset === "grayscale") { return; }
        const filterText = document.querySelector(`.${offset}`);
        filterText.textContent = filterState[offset];
    }
};

const filterHandler = {
    set: function (target, property, value) {
        // validate the values here
        //if valid set the values in state and run the  filter pipeline
        let checkValid = validateValues(target, property, value);
        // Image processing pipeline
        if (checkValid) {
            target[property] = value;
            runFilterPipeline(target);
            updateFilterValues();
            return true;
        } else {
            return false;
        }
    }
}

let filterStateProxy = new Proxy(filterState, filterHandler);

const initApp = () => {
    //get all DOM elements and setup event listeners
    //load any images or create canvas here.
    updateFilterValues();
    const canvasContainer = document.querySelector('.canvas-container');
    const orginalCanvas = document.getElementById('originalCanvas');
    const filterCanvas = document.getElementById('filterCanvas');
    const originalCtx = orginalCanvas.getContext('2d');
    filterCtx = filterCanvas.getContext('2d');
    srcImg = new Image();
    srcImg.src = 'img/iceland_300.jpg';
    srcImg.onload = () => {
        orginalCanvas.width = srcImg.width;
        orginalCanvas.height = srcImg.height;
        filterCanvas.width = srcImg.width;
        filterCanvas.height = srcImg.height;
        filterCtx.drawImage(srcImg, 0, 0, srcImg.width, srcImg.height);
        originalCtx.drawImage(srcImg, 0, 0, srcImg.width, srcImg.height);
        imgData = filterCtx.getImageData(0, 0, srcImg.width, srcImg.height);
        originalPixels = imgData.data.slice();
        // will change canvas image size if screen width size smaller than image width.
        const resizeCanvasImage = () => {
            if (canvasContainer.clientWidth < srcImg.width) {
                filterCanvas.width = canvasContainer.clientWidth;
                orginalCanvas.width = canvasContainer.clientWidth;
                filterCtx.drawImage(srcImg, 0, 0, canvasContainer.clientWidth, srcImg.height);
                originalCtx.drawImage(srcImg, 0, 0, canvasContainer.clientWidth, srcImg.height);
                imgData = filterCtx.getImageData(0, 0, srcImg.width, srcImg.height);
                originalPixels = imgData.data.slice();
            }
        };
        resizeCanvasImage();
        window.addEventListener("resize", resizeCanvasImage());
    }

    window.addEventListener("input", function (event) {
        if (event.target.id === 'grayscale') {
            filterStateProxy[event.target.id] = event.target.checked;
        } else {
            filterStateProxy[event.target.id] = Number(event.target.value);
        }
    });
};



/**
 * Method to check DOM is loaded, before query any DOM elements.
*/
let domLoaded;
const domReady = new Promise((resolve) => {
    domLoaded = resolve;
})
window.addEventListener("DOMContentLoaded", domLoaded);

domReady.then(initApp);

