JavaScript library for hand tracking applications featuring:

 * Skin detection
 * Erode / Dilate operations
 * Contour extraction
 * Contour optimization
 * Convex Hull calculation
 * Convexity Defects calculation

### Demo ###
[Basic Demo](http://www.inmensia.com/files/handtracking/demo/index.html), webcam basic demo

[Fast Demo](http://www.inmensia.com/files/handtracking/fast_demo/index.html), erode and dilate operations are disabled

### Video ###

[![js-handtracking](http://img.youtube.com/vi/0I1ar9Lrhsw/0.jpg)](http://www.youtube.com/watch?v=0I1ar9Lrhsw)

### Usage ###
Create one `HT.Tracker` object:

```
var tracker = new HT.Tracker();
```

Call `detect` function:

```
var candidate = tracker.detect(imageData);
```

`imageData` argument must be a valid `ImageData` canvas object.

`candidate` result (if any) will be a `HT.Candidate` object with the following properties:

 * `contour`: Optimized contour as a plain array of two dimensional vectors
 * `hull`: Convex hull as a plain array of two dimensional vectors
 * `defects`: Convexity defects as a plain array of objects

`defects` objects have the following properties:

 * `start`: Start point of hull segment as a two dimensional vector
 * `end`: End point of hull segment as a two dimensional vector
 * `depthPoint`: Deeper defect point as a two dimensional vector
 * `depth`: Minimum distance from hull segment to deeper defect point

### Skin detection ###
The library converts RGB images to HSV one. V and H channels are used to characterize the colors range for skin detection:

```
v >= 15 and v <= 250

h >= 3 and h <= 33
```

Note that source alpha channel is ignored.