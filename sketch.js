let featureExtractor;
let regressor;
let video;
let loss;
let slider;
let addSample;
let samples = 0;
let positionX = 140;
let t = 0;
let bool = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.hide();
  featureExtractor = ml5.featureExtractor('MobileNet', modelReady);
  regressor = featureExtractor.regression(video);
  createButtons();
    

    frameRate(IDEAL_FRAME_RATE);
    unitLength = Math.min(width, height) / 640;
    unitSpeed = unitLength / IDEAL_FRAME_RATE;
    strokeWeight(Math.max(1, 1 * unitLength));
    backgroundColor = color(252);
    frameCounter = new TimedFrameCounter(true, 60 * IDEAL_FRAME_RATE, () => { noLoop(); });
    initialize();
    
}

function draw() {

    
//        colorMode(HSB);
//    let hsbColor = color(t, 80, 80, 0.2);    
    let hsbColor = color(t, 0, 255, random(20));
//    noiseShapeColor = new NoFillShapeColor(hsbColor);
    noFill();
    stroke(hsbColor);
    
    
    if(bool){
    noiseShape.step();
//    noiseShapeColor.apply();
    noiseShape.draw();
    frameCounter.step();
}    
    //  background(255);
//  for (var i=0; i<width; i++) {
//    stroke(255 * noise(0.025 * i, t));
//    line(i, 0, i, height);
//  }
  t = slider.value()*360;
  console.log(t);
  image(video, 0, windowHeight-150, 200, 150);
}

// A function to be called when the model has been loaded
function modelReady() {
  select('#loading').html('Model loaded!');
}

// Classify the current frame.
function predict() {
  regressor.predict(gotResults);
    bool = true;
}

// A util function to create UI buttons
function createButtons() {
  slider = select('#slider');
  // When the Dog button is pressed, add the current frame
  // from the video with a label of "dog" to the classifier
  addSample = select('#addSample');
  addSample.mousePressed(function() {
    regressor.addImage(slider.value());
    select('#amountOfSamples').html(samples++);
  });

  // Train Button
  train = select('#train');
  train.mousePressed(function() {
    regressor.train(function(lossValue) {
      if (lossValue) {
        loss = lossValue;
        select('#loss').html('Loss: ' + loss);
      } else {
        select('#loss').html('Done Training.<br> Final Loss: ' + loss);
      }
    });
  });

  // Predict Button
  buttonPredict = select('#buttonPredict');
  buttonPredict.mousePressed(predict);
}

// Show the results
function gotResults(err, result) {
  if (err) {
    console.error(err);
  }
  positionX = map(result, 0, 1, 0, width);
  slider.value(result);
  predict();
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}




function initialize() {
    background(backgroundColor);
    noiseShape = new NoiseShape({
        shapeSize: 200 * unitLength,
        vertexCount: Math.floor(320 * unitLength),
        noiseDistanceScale: random(0.3, 2.0),
        noiseMagnitudeFactor: 5.2, //2.2
        noiseTimeScale: random(0.001, 0.005),
    });
    noiseShape.centerPosition.set(0.5 * width + 200, 0.5 * height);
//    colorMode(HSB, 360, 100, 100, 100);
//    let hsbColor;
//    switch (randomInt(3)) {
//        case 0:
//            hsbColor = color(0, 100, 45, 7);
//            break;
//        case 1:
//            hsbColor = color(120, 100, 45, 6);
//            break;
//        case 2:
//            hsbColor = color(240, 100, 40, 6);
//            break;
//    }
//    colorMode(RGB);
//    noiseShapeColor = new NoFillShapeColor(hsbColor);
    frameCounter.resetCount();
    frameCounter.on();
    loop();
}
function keyPressed() {
    if (keyCode === 32)
        initialize();
}



//////////////////////////////////////////////////////////////////////////////


function loopArray(array, callback) {
    for (let i = array.length - 1; i >= 0; i -= 1) {
        callback(array[i], i, array);
    }
}

class ArrayWrapper {
    constructor() {
        this.array = [];
    }
    get length() {
        return this.array.length;
    }
    get(index) {
        return this.array[index];
    }
    push(element) {
        this.array.push(element);
    }
    pop() {
        return this.array.pop();
    }
    loop(callback) {
        loopArray(this.array, callback);
    }
}
//

class SteppableArray extends ArrayWrapper {
    static stepFunction(value) {
        value.step();
    }
    step() {
        this.loop(SteppableArray.stepFunction);
    }
}

class DrawableArray extends ArrayWrapper {
    static drawFunction(value) {
        value.draw();
    }
    draw() {
        this.loop(DrawableArray.drawFunction);
    }
}

class SpriteArray extends ArrayWrapper {
    constructor() {
        super(...arguments);
        this.draw = DrawableArray.prototype.draw;
        this.step = SteppableArray.prototype.step;
    }
}


class NoiseShape {
    constructor(params) {
        this.centerPosition = createVector();
        this.shapeSize = params.shapeSize;
        this.noiseMagnitudeFactor = params.noiseMagnitudeFactor;
        this.vertexCount = params.vertexCount || Math.floor(0.75 * params.shapeSize);
        this.noiseDistanceScale = params.noiseDistanceScale || params.shapeSize / 320;
        this.noiseTimeScale = params.noiseTimeScale || 0.005;
        this.xNoiseParameterOffset
            = createVector(Math.random(), Math.random(), Math.random()).mult(1024);
        this.yNoiseParameterOffset
            = createVector(Math.random(), Math.random(), Math.random()).mult(1024);
        this.noiseTime = 0;
    }
    step() {
        this.noiseTime += this.noiseTimeScale;
    }
    draw() {
        const baseDistance = 0.5 * this.shapeSize;
        const noiseMagnitude = this.noiseMagnitudeFactor * baseDistance;
        beginShape();
        for (let i = 0; i < this.vertexCount; i += 1) {
            const vertexAngle = (i / this.vertexCount) * TWO_PI;
            const cosine = cos(vertexAngle);
            const sine = sin(vertexAngle);
            const baseX = baseDistance * cosine;
            const baseY = baseDistance * sine;
            const noiseX = (2 * noise(this.xNoiseParameterOffset.x + this.noiseDistanceScale * cosine, this.xNoiseParameterOffset.y + this.noiseDistanceScale * sine, this.xNoiseParameterOffset.z + this.noiseTime) - 1) * noiseMagnitude;
            const noiseY = (2 * noise(this.yNoiseParameterOffset.x + this.noiseDistanceScale * cosine, this.yNoiseParameterOffset.y + this.noiseDistanceScale * sine, this.yNoiseParameterOffset.z + this.noiseTime) - 1) * noiseMagnitude;
            vertex(this.centerPosition.x + baseX + noiseX, this.centerPosition.y + baseY + noiseY);
        }
        endShape(CLOSE);
    }
}
//
// ------------ Frame counter -----------------------------
//
class FrameCounter {
    constructor() {
        this.count = 0;
    }
    static initializeStatic(frameRate) {
        this.frameRate = frameRate;
    }
    resetCount(count = 0) {
        this.count = count;
    }
    step() {
        this.count += 1;
    }
    mod(divisor) {
        return this.count % divisor;
    }
    /**
     * Returns ratio from 0 to 1 according to current frame count and given frequency per second.
     * @param frequency {number} - frequency per second
     */
    getCycleProgressRatio(frequency) {
        return ((frequency * this.count) % FrameCounter.frameRate) / FrameCounter.frameRate;
    }
    /**
     * Returns sine value (from 0 to 1)according to
     * current frame count and given frequency per second.
     * @param frequency {number} - frequency per second
     */
    sin(frequency = 1) {
        return Math.sin(this.getCycleProgressRatio(frequency) * TWO_PI);
    }
}
class TimedFrameCounter extends FrameCounter {
    constructor(on, duration = 0, completeBehavior = () => { }) {
        super();
        this.isOn = on;
        this.isCompleted = false;
        this.completeBehavior = completeBehavior;
        this.durationFrameCount = duration;
    }
    on(duration) {
        this.isOn = true;
        if (duration)
            this.durationFrameCount = duration;
    }
    off() {
        this.isOn = false;
    }
    step() {
        if (!this.isOn)
            return;
        this.count += 1;
        if (this.count > this.durationFrameCount) {
            this.isCompleted = true;
            this.isOn = false;
            this.completeBehavior();
        }
    }
    getProgressRatio() {
        if (this.durationFrameCount)
            return constrain(this.count / this.durationFrameCount, 0, 1);
        else
            return 0;
    }
}

class AbstractShapeColor {
    static createAlphaColorArray(c) {
        const array = [];
        for (let alphaValue = 0; alphaValue <= 255; alphaValue += 1) {
            array.push(color(red(c), green(c), blue(c), alpha(c) * alphaValue / 255));
        }
        return array;
    }
}
class ShapeColor extends AbstractShapeColor {
    constructor(strokeColor, fillColor) {
        super();
        this.strokeColorArray = AbstractShapeColor.createAlphaColorArray(strokeColor);
        this.fillColorArray = AbstractShapeColor.createAlphaColorArray(fillColor);
    }
    apply(alphaValue = 255) {
        const index = Math.floor(constrain(alphaValue, 0, 255));
        stroke(this.strokeColorArray[index]);
        fill(this.fillColorArray[index]);
    }
}
class NoStrokeShapeColor extends AbstractShapeColor {
    constructor(fillColor) {
        super();
        this.fillColorArray = AbstractShapeColor.createAlphaColorArray(fillColor);
    }
    apply(alphaValue = 255) {
        noStroke();
        const index = Math.floor(constrain(alphaValue, 0, 255));
        fill(this.fillColorArray[index]);
    }
}

class NoFillShapeColor extends AbstractShapeColor {
    constructor(strokeColor) {
        super();
        this.strokeColorArray = AbstractShapeColor.createAlphaColorArray(strokeColor);
    }
    apply(alphaValue = 255) {
        const index = Math.floor(constrain(alphaValue, 0, 255));
        stroke(this.strokeColorArray[index]);
        noFill();
    }
}
class NullShapeColor extends AbstractShapeColor {
    apply() { }
}
//
// ------------ Random int -----------------------------
//
/**
 * Returns random integer from 0 up to (but not including) the max number.
 */
function randomInt(maxInt) {
    return Math.floor(Math.random() * maxInt);
}
// ------------ Global variables ------------------------------
//
p5.disableFriendlyErrors = true;
const IDEAL_FRAME_RATE = 60;
let unitLength;
let unitSpeed;
let backgroundColor;
let frameCounter;
let noiseShape;
let noiseShapeColor;

function getCurrentISODate() {
    const dateTime = new Date().toISOString();
    return dateTime.substring(0, dateTime.indexOf('T'));
}

