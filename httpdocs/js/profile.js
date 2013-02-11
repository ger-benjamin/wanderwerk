/**
 * API created by Benjamin Gerber
 * Open source, following the licence "Creative Commons BY-NC"
 * Based on OpenLayers 2.12, GeoExt 1.1, HighCharts 2.3.5, Geonames, GeoAdmin API and
 * Wanderwerk Alpha (created in 2012 by Benjamin Gerber and Nicolas PY as
 * a school-project for COMEM, HEIG-VD).
 */
/**
 * Instanciate an object Line.
 * Point is a OpenLayers vector's feature (Type Line) with name, color, array
 * of points and data (profile's array of informations like time, km, etc...)
 * By default, feature is null, points is an empty array, name is the given
 *  name or empty string, color is the given color or null and data is null.
 * @param {OpenLayers.Feature.Vector} line
 * @param {String} color
 * @param {String} name
 */
function Profile (line, color, name) {
    this.line = line || null;
    this.points = [];
    this.name = name || '';
    this.setColor(true, color);
    this.data = null;
}

/**
 * Set the color if color is a String and line (feature) existe.
 * If highlight is true, set line's stroke at 5 (1 else).
 * @param {Boolean} highlight
 * @param {String} color
 */
Profile.prototype.setColor = function (highlight, color) {
    var style;
    if (color && typeof color === 'string') {
        this.color = color;
    }
    if (!this.line || !this.color) {
        return;
    }
    style = OpenLayers.Util.applyDefaults(style, OpenLayers.Feature.Vector.style['default']);
    style.strokeColor = this.color;
    if (highlight) {
        style.strokeWidth = 5;
    } else {
        style.strokeWidth = 1;
    }
    this.line.style = style;
};

/**
 * If given point is a OpenLayers.Feature.Vector (type point), add point at
 * this.points's array, set type of point at 'firstPoint' or 'LastPoint' if
 *  it's respectively the first or seconde point of the points's array and call
 *  method 'replacePoint'.  
 * @param {OpenLayers.Feature.Vector} point
 */
Profile.prototype.addPoint = function (point) {
    var type;
    if (!point) {
        return;
    }
    if (this.points.length === 0) {
        type = 'firstPoint';
    } else if (this.points.length === 1) {
        type = 'lastPoint';
    }
    point.setType(type);
    this.points.push(point);
    this.replacePoint(point);
};

/**
 * If point is in points's array and isn't the first or the last point,
 * remove the points.
 * @param {OpenLayers.Feature.Vector} point
 */
Profile.prototype.removePoint = function (point) {
    var pointInProfile = this.getPointInProfile(point);
    if (!pointInProfile.point || pointInProfile.point.type === 'firstPoint' || pointInProfile.point.type === 'lastPoint') {
        return;
    }
    this.points.splice(pointInProfile.position, 1);
    delete pointInProfile.point.destroy();
};

/**
 * Retrieve a point in this points's array. Return a object with the point and 
 * the position in points's array.
 * @param {OpenLayers.Feature.Vector} point
 * @return {Object} objectwith point and position (of point, in points's array).
 */
Profile.prototype.getPointInProfile = function (point) {
    var i, pointTemp, obj;
    if (point) {
        for (i = 0; i < this.points.length; i++) {
            if (this.points[i] === point || this.points[i].feature.id === point.id) {
                pointTemp = this.points[i];
                break;
            }
        }
    }
    obj = {
        point: pointTemp,
        position: i
    };
    return obj;
};

/**
 * Call method 'replacePoint' with all points in this points's array.
 */
Profile.prototype.replaceAllPoints = function () {
    for (var i = 0; i < this.points.length; i++) {
        this.replacePoint(this.points[i]);
    }
};

/**
 * Move th given point to the nearest segment of the line. Given point must be
 * a Point or an OpenLayers.Feature.Vector (type Point).
 * @param {Point} point
 * @returns {Boolean} (true if point is replaced, false else)
 */
Profile.prototype.replacePoint = function (point) {
    var distanceLineToPoint, posX, posY, linelastPoint = this.line.geometry.getVertices().length - 1;
    if (point instanceof OpenLayers.Feature.Vector) {
        point = this.getPointInProfile(point).point;
    }
    if (!point) {
        return false;
    }
    if (point.type === 'firstPoint') {
        posX = this.line.geometry.getVertices()[0].x;
        posY = this.line.geometry.getVertices()[0].y;
    } else if (point.type === 'lastPoint') {
        posX = this.line.geometry.getVertices()[linelastPoint].x;
        posY = this.line.geometry.getVertices()[linelastPoint].y;
    } else {
        distanceLineToPoint = point.feature.geometry.distanceTo(this.line.geometry, {
            details: true,
            edge: true
        });
        posX = distanceLineToPoint.x1;
        posY = distanceLineToPoint.y1;
    }
    point.move(posX, posY);
    return true;
};

/**
 * Sort point's array depending of line's direction.
 */
Profile.prototype.sortPoints = function () {
    var i, j, k, pointsPos = [], pointsInLine = [], pointA, pointB,
            pointC, vec1, vec2, d1, d2, temp, isAlreadyAdded, newPoints = [];

    //Create an array with all points in one segment of the line
    for (i = 1; i < this.line.geometry.getVertices().length; i++) {
        pointsInLine.length = 0;
        pointsPos.length = 0;
        pointA = this.line.geometry.getVertices()[i - 1];
        pointB = this.line.geometry.getVertices()[i];
        for (j = 0; j < this.points.length; j++) {
            pointC = this.points[j].feature.geometry;
            vec1 = [(pointB.x - pointA.x), (pointB.y - pointA.y)];
            vec2 = [(pointC.x - pointA.x), (pointC.y - pointA.y)];
            d1 = vec1[0] * vec2[1];
            d2 = vec1[1] * vec2[0];
            if (Math.round(d1) === Math.round(d2)) { //Math.floor because OpenLayers generates differences of some micro metre
                pointsInLine.push(this.points[j]);
                pointsPos.push(j);
            }
        }
        //delete point finded in segment to shorten the previous for-loop
        for (j = 0; j < pointsPos.length; j++) {
            this.points.splice(pointsPos[j] - j, 1); //-j because position change when this remove a previous element
        }
        //Ordre each points on the segment of the line
        //(this Algorithme is nammed "Bubble sort".
        for (j = (pointsInLine.length - 1); j >= 0; j--) {
            for (k = pointsInLine.length - 1; k >= 0; k--) {
                if (pointA.distanceTo(pointsInLine[k].feature.geometry) < pointA.distanceTo(pointsInLine[j].feature.geometry)) {
                    temp = pointsInLine[k];
                    pointsInLine[k] = pointsInLine[j];
                    pointsInLine[j] = temp;
                }
            }
        }
        //Add ordered points in a new array (if it's not already in this new
        //array, that's possible because of the Math.floor above).
        for (j = 0; j < pointsInLine.length; j++) {
            isAlreadyAdded = false;
            for (k = 0; k < newPoints.length; k++) {
                if (pointsInLine[j] === newPoints[k]) {
                    isAlreadyAdded = true;
                }
            }
            if (!isAlreadyAdded) {
                newPoints.push(pointsInLine[j]);
            }
        }
    }
    //set the sorted points array of this object by the ordered points
    this.points = newPoints;
};

/**
 * Call geonames to set altitudes for each point without altitude.
 * Send points by slice of 20 points because free version of geonames doesn't
 * accept more points in a row.
 * @param {Object} ctx context to use in after ajax request (thus, main context)
 */
Profile.prototype.calculateAltitudes = function (ctx) {
    var i, maxPoints = 20, pointsWithoutAltitudes = [], arrayOfPoints = [], index = 0;
    for (i = 0; i < this.points.length; i++) {
        if (!this.points[i].altitude) {
            pointsWithoutAltitudes.push(this.points[i]);
        }
    }
    while (pointsWithoutAltitudes.length > index) {
        arrayOfPoints.push(pointsWithoutAltitudes.slice(index, maxPoints + index));
        index += maxPoints;
    }
    ajaxObject.ctx = ctx;
    ajaxObject.fn = requestAltitudes;
    ajaxObject.arrayOfPoints = arrayOfPoints;
    requestAltitudes();
};

/**
 * Destroy line's feature, call destroy method on all points and
 * delete the this.
 */
Profile.prototype.destroy = function () {
    for (var i = 0; i < this.points.length; i++) {
        this.points[i].destroy();
        delete this.point[i];
    }
    this.line.destroy();
    delete this;
};