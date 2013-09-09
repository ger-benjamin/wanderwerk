/**
 * API created by Benjamin Gerber
 * Open source, following the licence "Creative Commons BY-NC"
 * Based on OpenLayers 2.12, GeoExt 1.1, HighCharts 2.3.5, Geonames, GeoAdmin API
 * jquery and a prototype of Wanderwerk (created in 2012 by Benjamin Gerber and Nicolas PY as
 * a school-project for COMEM, HEIG-VD).
 */
/**
 * function used to get points altitude
 */
/**
 * Object used in ajax request. Contain contexte, function to call after result,
 * the array of array of point to send at Geonames (array (in array) with max
 *  20 points for this free version of GeoNames) and some variable to calculate 
 *  all points.
 * @type object
 */
var ajaxObject = {
    workEnded: false,
    fn: null,
    ctx: null,
    arrayOfPoints: null,
    noCurrentProfile: 0,
    noCurrentPoints: 0,
    error: null
};

/**
 * Fill ajaxObject's 'arrayOfPoints', fn and ctx of fn (fonction) befor call
 * this function. This function will calculate all points in all array given in
 * ajaxObject. When all points have an altitude, call function 'fn' in ajax
 * object from context 'ctx' in ajaxObject too.
 * In case of failure, display a message. 
 */
function requestAltitudes() {
    var i, points, latsA = [], lngsA = [],
            lats, lngs, lngLat, convertedLngLats = [];
    if (ajaxObject.workEnded || ajaxObject.arrayOfPoints.length <= 0) {
        ajaxObject.workEnded = false;
        if (ajaxObject.ctx) {
            ajaxObject.ctx.calculate();
        }
        return;
    } else {
        points = ajaxObject.arrayOfPoints[ajaxObject.noCurrentPoints];
    }
    //convert EPSG:21781 (Swiss) spatial representation to EPSG:4326 required by GeoNames
    for (i = 0; i < points.length; i++) {
        lngLat = OpenLayers.LonLat.fromArray([points[i].feature.geometry.x, points[i].feature.geometry.y]);
        convertedLngLats.push(lngLat.transform(new OpenLayers.Projection('EPSG:21781'), new OpenLayers.Projection('EPSG:4326'))); //temporary hardcoded
    }
    for (i = 0; i < convertedLngLats.length; i++) {
        latsA.push(convertedLngLats[i].lat);
        lngsA.push(convertedLngLats[i].lon);
    }

    lats = latsA.join();
    lngs = lngsA.join();

    Ext.Ajax.request({
        url: "php/proxy.php",
        method: 'POST',
        params: {
            lats: lats,
            lngs: lngs
        },
        success: function(result, request) {
            var j, altitudes = Ext.decode(result.responseText);

            if (ajaxObject.arrayOfPoints && typeof parseInt(altitudes[0]) === "number") {
                for (j = 0; j < ajaxObject.arrayOfPoints[ajaxObject.noCurrentPoints].length; j++) {
                    ajaxObject.arrayOfPoints[ajaxObject.noCurrentPoints][j].setAltitude(parseInt(altitudes[j]));
                }
                ajaxObject.noCurrentPoints++;
            }

            if (!ajaxObject.arrayOfPoints[ajaxObject.noCurrentPoints] || !ajaxObject.arrayOfPoints || typeof parseInt(altitudes[0]) !== "number") {
                ajaxObject.noCurrentPoints = 0;
                ajaxObject.workEnded = true;
            }

            if (ajaxObject.fn) {
                ajaxObject.fn();
            }
        },
        failure: function(result, request) {
            this.ajaxObject.workEnded = true;
            this.error = result;
        }
    });
}