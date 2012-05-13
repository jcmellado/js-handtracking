/*
Copyright (c) 2012 Juan Mellado

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
References:
- "OpenCV: Open Computer Vision Library"
  http://sourceforge.net/projects/opencvlibrary/
*/

var CV = CV || {};

CV.Image = function(width, height, data){
  this.width = width || 0;
  this.height = height || 0;
  this.data = data || [];
};

CV.findContours = function(imageSrc){
  var contours = [], src = imageSrc.data,
      width = imageSrc.width - 2, height = imageSrc.height - 2,
      pos = width + 3, nbd = 1,
      deltas, pix, outer, hole, i, j;

  deltas = CV.neighborhoodDeltas(width + 2);

  for (i = 0; i < height; ++ i, pos += 2){
  
    for (j = 0; j < width; ++ j, ++ pos){
      pix = src[pos];

      if (0 !== pix){
        outer = hole = false;

        if (1 === pix && 0 === src[pos - 1]){
          outer = true;
        }
        else if (pix >= 1 && 0 === src[pos + 1]){
          hole = true;
        }

        if (outer || hole){
          ++ nbd;
          
          contours.push( CV.borderFollowing(src, pos, nbd,
            {x: j, y: i}, hole, deltas) );
        }
      }
    }
  }  

  return contours;
};

CV.borderFollowing = function(src, pos, nbd, point, hole, deltas){
  var contour = [], pos1, pos3, pos4, s, s_end, s_prev;

  contour.hole = hole;
      
  s = s_end = hole? 0: 4;
  do{
    s = (s - 1) & 7;
    pos1 = pos + deltas[s];
    if (src[pos1] !== 0){
      break;
    }
  }while(s !== s_end);
  
  if (s === s_end){
    src[pos] = -nbd;
    contour.push( {x: point.x, y: point.y} );

  }else{
    pos3 = pos;
    s_prev = s ^ 4;

    while(true){
      s_end = s;
    
      do{
        pos4 = pos3 + deltas[++ s];
      }while(src[pos4] === 0);
      
      s &= 7;
      
      if ( ( (s - 1) >>> 0) < (s_end >>> 0) ){
        src[pos3] = -nbd;
      }
      else if (src[pos3] === 1){
        src[pos3] = nbd;
      }

      contour.push( {x: point.x, y: point.y} );
      
      s_prev = s;

      point.x += CV.neighborhood[s][0];
      point.y += CV.neighborhood[s][1];

      if ( (pos4 === pos) && (pos3 === pos1) ){
        break;
      }
      
      pos3 = pos4;
      s = (s + 4) & 7;
    }
  }

  return contour;
};

CV.neighborhood = 
  [ [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1] ];

CV.neighborhoodDeltas = function(width){
  var deltas = [], len = CV.neighborhood.length, i = 0;
  
  for (; i < len; ++ i){
    deltas[i] = CV.neighborhood[i][0] + (CV.neighborhood[i][1] * width);
  }
  
  return deltas.concat(deltas);
};

CV.approxPolyDP = function(contour, epsilon){
  var slice = {start_index: 0, end_index: 0},
      right_slice = {start_index: 0, end_index: 0},
      poly = [], stack = [], len = contour.length,
      pt, start_pt, end_pt, dist, max_dist, le_eps,
      dx, dy, i, j, k;
  
  epsilon *= epsilon;
  
  k = 0;
  
  for (i = 0; i < 3; ++ i){
    max_dist = 0;
    
    k = (k + right_slice.start_index) % len;
    start_pt = contour[k];
    if (++ k === len) {k = 0;}
  
    for (j = 1; j < len; ++ j){
      pt = contour[k];
      if (++ k === len) {k = 0;}
    
      dx = pt.x - start_pt.x;
      dy = pt.y - start_pt.y;
      dist = dx * dx + dy * dy;

      if (dist > max_dist){
        max_dist = dist;
        right_slice.start_index = j;
      }
    }
  }

  if (max_dist <= epsilon){
    poly.push( {x: start_pt.x, y: start_pt.y} );

  }else{
    slice.start_index = k;
    slice.end_index = (right_slice.start_index += slice.start_index);
  
    right_slice.start_index -= right_slice.start_index >= len? len: 0;
    right_slice.end_index = slice.start_index;
    if (right_slice.end_index < right_slice.start_index){
      right_slice.end_index += len;
    }
    
    stack.push( {start_index: right_slice.start_index, end_index: right_slice.end_index} );
    stack.push( {start_index: slice.start_index, end_index: slice.end_index} );
  }

  while(stack.length !== 0){
    slice = stack.pop();
    
    end_pt = contour[slice.end_index % len];
    start_pt = contour[k = slice.start_index % len];
    if (++ k === len) {k = 0;}
    
    if (slice.end_index <= slice.start_index + 1){
      le_eps = true;
    
    }else{
      max_dist = 0;

      dx = end_pt.x - start_pt.x;
      dy = end_pt.y - start_pt.y;
      
      for (i = slice.start_index + 1; i < slice.end_index; ++ i){
        pt = contour[k];
        if (++ k === len) {k = 0;}
        
        dist = Math.abs( (pt.y - start_pt.y) * dx - (pt.x - start_pt.x) * dy);

        if (dist > max_dist){
          max_dist = dist;
          right_slice.start_index = i;
        }
      }
      
      le_eps = max_dist * max_dist <= epsilon * (dx * dx + dy * dy);
    }
    
    if (le_eps){
      poly.push( {x: start_pt.x, y: start_pt.y} );

    }else{
      right_slice.end_index = slice.end_index;
      slice.end_index = right_slice.start_index;

      stack.push( {start_index: right_slice.start_index, end_index: right_slice.end_index} );
      stack.push( {start_index: slice.start_index, end_index: slice.end_index} );
    }
  }
  
  return poly;
};

CV.erode = function(imageSrc, imageDst){
  return CV.applyKernel(imageSrc, imageDst, Math.min);
};
    
CV.dilate = function(imageSrc, imageDst){
  return CV.applyKernel(imageSrc, imageDst, Math.max);
};
    
CV.applyKernel = function(imageSrc, imageDst, fn){
  var src = imageSrc.data, dst = imageDst.data,
      width = imageSrc.width, height = imageSrc.height,
      offsets = [-width - 1, -width, -width + 1, -1, 1, width - 1, width, width + 1],
      klen = offsets.length,
      pos = 0, value, i, j, k;
  
  for (i = 0; i < width; ++ i){
    dst[pos ++] = 0;
  }

  for (i = 2; i < height; ++ i){
    dst[pos ++] = 0;

    for (j = 2; j < width; ++ j){
      value = src[pos];
      
      for (k = 0; k < klen; ++ k){
        value = fn(value, src[ pos + offsets[k] ] );
      }
      
      dst[pos ++] = value;
    }
    
    dst[pos ++] = 0;
  }

  for (i = 0; i < width; ++ i){
    dst[pos ++] = 0;
  }

  imageDst.width = imageSrc.width;
  imageDst.height = imageSrc.height;
  
  return imageDst;
};

CV.convexHull = function(points){
  var deque = [], i = 3, point;

  if (points.length >= 3){

    if ( CV.position(points[0], points[1], points[2]) > 0){
      deque.push(points[0]);
      deque.push(points[1]);
    }else{
      deque.push(points[1]);
      deque.push(points[0]);
    }
    deque.push(points[2]);
    deque.unshift(points[2]);

    for (; i < points.length; ++ i){
      point = points[i];

      if ( CV.position(point, deque[0], deque[1]) < 0 ||
           CV.position(deque[deque.length - 2], deque[deque.length - 1], point) < 0 ){
           
        while( CV.position(deque[deque.length - 2], deque[deque.length - 1], point) <= 0 ){
          deque.pop();
        }
        deque.push(point);
        
        while( CV.position(point, deque[0], deque[1]) <= 0 ){
          deque.shift();
        }
        deque.unshift(point);
      }
    }

  }

  return deque;
};

CV.position = function(p1, p2, p3){
  return ( (p2.x - p1.x) * (p3.y - p1.y) ) - ( (p3.x - p1.x) * (p2.y - p1.y) );
};

CV.convexityDefects = function(points, hull){
  var defects = [], len = hull.length,
      curr, next, point, dx0, dy0, scale, defect, isDefect,
      idx1, idx2, idx3, sign, inc, depth, dx, dy, dist, i, j;
  
  if (len >= 3){
    idx1 = CV.indexPoint(points, hull[0]);
    idx2 = CV.indexPoint(points, hull[1]);
    idx3 = CV.indexPoint(points, hull[2]);
    
    sign = 0;
    sign += idx2 > idx1? 1: 0;
    sign += idx3 > idx2? 1: 0;
    sign += idx1 > idx3? 1: 0;
    
    inc = (sign === 2)? 1: -1;
    
    j = idx1;
    curr = hull[0];
    
    for (i = 1; i !== len; ++ i){
      next = hull[i];
      isDefect = false;
      depth = 0;
    
      dx0 = next.x - curr.x;
      dy0 = next.y - curr.y;
      scale = 1 / Math.sqrt(dx0 * dx0 + dy0 * dy0);
    
      defect = {start: curr, end: next};

      while(true){
        j += inc;
        j = (j < 0)? points.length - 1: j % points.length;
        
        point = points[j];
        
        if (point.x === next.x && point.y === next.y){
          break;
        }

        dx = point.x - curr.x;
        dy = point.y - curr.y;
        dist = Math.abs(-dy0 * dx + dx0 * dy) * scale;
      
        if (dist > depth){
          isDefect = true;
          
          defect.depth = depth = dist;
          defect.depthPoint = point;
        }
      }
      
      if (isDefect){
        defects.push(defect);
      }
      
      curr = next;
    }
  }
  
  return defects;
};

CV.indexPoint = function(points, point){
  var len = points.length, i = 0;
  for (; i < len; ++ i){
    if (points[i].x === point.x && points[i].y === point.y){
      break;
    }
  }
  return i;
};

CV.area = function(poly){
  var area = 0, len = poly.length, i = 1,
      x, y, xmin, xmax, ymin, ymax;

  if (len > 0){
    xmin = xmax = poly[0].x;
    ymin = ymax = poly[0].y;
  
    for (; i < len; ++ i){
      x = poly[i].x;
      if (x < xmin){
        xmin = x;
      }
      if (x > xmax){
        xmax = x;
      }
      
      y = poly[i].y;
      if (y < ymin){
        ymin = y;
      }
      if (y > ymax){
        ymax = y;
      }
    }
  
    area = (xmax - xmin + 1) * (ymax - ymin + 1);
  }
  
  return area;
};
