/**
 * API created by Benjamin Gerber
 * Open source, following the licence "Creative Commons BY-NC"
 * Based on OpenLayers 2.12, GeoExt 1.1, HighCharts 2.3.5, Geonames, GeoAdmin API
 * jquery and a prototype of Wanderwerk (created in 2012 by Benjamin Gerber and Nicolas PY as
 * a school-project for COMEM, HEIG-VD).
 */
/**
 * Instanciate an object Point.
 * Point is a OpenLayers vector's feature (Type Point) with name, altitude and
 * type  (First point, last point, normale, etc) and visibility.
 * By default, altitude is null, name is the currents coordonnates,
 * feature is null, type is 'normal' and visibility is at true;
 * @param {OpenLayers.Feature.Vector} point
 */
function Point(point) {
    this.feature = point || null;
    this.isAutoName = true;
    this.setName();
    this.setType();
    this.altitude = null;
    this.setVisibility();
}

/**
 * Move point at given coordinates (x;y).
 * x and y must be numbers and this.feature can be null
 * Reset altitude only if mouvement is > 30 meters (work only in EPSG:21781).
 * Because GeoNames (altitudes's suppliers) give altitude in exchange of 0.2 credits.
 * You have some credit per hours, weeks and monates. If you exceed your quota, you need to wait  
 * Rename the point with the news coordinates
 * Currently work only with metrics systems. 
 * @param {type} x
 * @param {type} y
 * @returns {Boolean} (true if point is moved, false else)
 */
Point.prototype.move = function(x, y) {
    if (!this.feature || typeof x !== "number" || typeof y !== "number") {
        return false;
    }
    //Reset altitude if mouvement is > 30 meters. Because GeoNames (altitudes'd suppliers)
    //Work only with metrics systems 
    if (Math.abs(this.feature.getGeometry().getCoordinates()[0] - x) >= 30 || Math.abs(this.feature.getGeometry().getCoordinates()[1] - y) >= 30) {
        this.altitude = null;
    }
    this.feature.getGeometry().setCoordinates([Math.round(x), Math.round(y)]);
    this.setName();
    return true;
};

/**
 * Set the name of this point. If name is null or not a String,
 * the name will be unchanged (if setted with a different name that the default name)
 *  or will be the default name, the current corrdinate of the point. 
 * @param {String} name
 */
Point.prototype.setName = function(name) {
    if (name && typeof name === 'string') {
        this.name = name;
        this.isAutoName = false;
    } else if (this.feature && this.isAutoName) {
        this.name = Math.round(this.feature.getGeometry().getCoordinates()[0]) + ", " + Math.round(this.feature.getGeometry().getCoordinates()[1]);
    }
};

/**
 * 
 * Set the Type of the point. If the type is null or not a String, the type will be 'normal'
 * @param {String} type
 */
Point.prototype.setType = function(type) {
    this.type = (type && typeof type === 'string') ? type : 'normal';
};

/**
 * Set altitude of the point if current altitude is null (return true)
 *  or if (return false) : 
 *   - this.feature is null,
 *   - given altitude isn't a number,
 *   - given altitude is under -500 ( ~ dead See)
 *   - or altitude is under 9000 ( ~ Everest mout)
 * @param {number} altitude
 * @return Boolean false or true
 */
Point.prototype.setAltitude = function(altitude) {
    if (!this.feature || typeof altitude !== 'number' || altitude < -500 || altitude > 9000) {
        return false;
    }
    if (this.altitude) {
        return true;
    }
    this.altitude = altitude;
};

/**
 * Set visibility of the point (true or false)
 * @param {Boolean} visibility
 */
Point.prototype.setVisibility = function(visibility) {
    var style = null;
    if (visibility !== false) {
        this.visible = true;
    } else {
        this.visible = false;
        style = {visibility: 'hidden'};
    }
    if (this.feature) {
        this.feature.style = style;
    }
};

/**
 * Destroy point's feature and delete the this.
 */
Point.prototype.destroy = function() {
    this.feature.destroy();
};

