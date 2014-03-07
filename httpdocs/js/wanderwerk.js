/**
 * API created by Benjamin Gerber
 * Open source, following the licence "Creative Commons BY-NC"
 * Based on OpenLayers 2.12, GeoExt 1.1, HighCharts 2.3.5, Geonames, GeoAdmin API
 * jquery and a prototype of Wanderwerk (created in 2012 by Benjamin Gerber and Nicolas PY as
 * a school-project for COMEM, HEIG-VD).
 */

//Global variables
var map = null,
        profileDs = null,
        compareDs = null,
        layers = {},
        controls = {},
        buttons = {},
        chartPanel = null,
        chart = null,
        profiles = [],
        currentProfile = null;
/**
 * First instruction, create panels and add controls.
 */
Ext.onReady(function() {
    this.displayWaitMessage(true);
    this.makePanels(); //see ./interfaces.js
    this.initMap();
    this.setChart();
    this.addMapsControls();
    this.bindEvents();
    this.displayWaitMessage(false);
});

function initMap() {
    var layer = ga.layer.create('ch.swisstopo.pixelkarte-farbe');

    this.map = new ga.Map({
        target: 'ww_map-panel-innerCt',
        layers: [layer],
        view: new ol.View2D({
            resolution: 500,
            center: [670000, 160000]
        })
    });
}

/**
 * Add some controls and layers at the used map
 */
function addMapsControls() {
    //add keybord controls
    //this.map.addControl(new OpenLayers.Control.KeyboardDefaults());

    //add controls for lines
    this.addLineControls();
    //add controls for points
    this.addPointsControls();
    //add button to switch controls.
    addButtonsControl();
}

/**
 * Add possibilities to create (draw) and modify lines on the map
 * Add functions to features's events
 */
function addLineControls() {
    //Add the option and the layers wich give the ability to draw lines on the map.
    addDrawOption();
    //When a line is updated , call the function "onLineAdded". 
    this.layers.lines.getSource().addEventListener('addfeature', this.onLineAdded, false, this);
    //Add controls (update) on an created line (select, move)
    //After a line is "dragged", call the function "onDragLineComplete"
//    this.controls.updateLine = new OpenLayers.Control.ModifyFeature(this.layers.lines, {
//        'dragComplete': onDragLineComplete,
//        'ctx': this
//    }, this);
//    //Add update control in a button and on the map 
//    this.map.addControl(this.controls.updateLine);
//    this.buttons.updateLine = this.createButton('Modifier les tracés', 'updateLine', this.toggleControl, 'updateLine');
}
/**
 * Add the option and the layer wich allow to draw lines.
 * Also set the style of the line.
 */
function addDrawOption() {
    var source = new ol.source.Vector();
    this.layers.lines = getBasicVectorLayer(source);

    //Add layer to the map
    this.map.addLayer(this.layers.lines);
    //Create the "draw line" feature's control and add it to the map and to a button.
    this.controls.addLine = new ol.interaction.Draw({
        source: source,
        type: 'LineString'
    });
    this.map.addInteraction(this.controls.addLine);

    this.buttons.addLine = this.createButton('Ajouter des tracés', 'addLine', this.toggleControl, 'addLine');
}

function getBasicVectorLayer(source, supStyle) {
    var i = 0, styleArray;
    if (!supStyle || !supStyle.lenght) {
        supStyle = [];
    }

    styleArray = [
        new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#FF0000',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#00FF00'
                })
            })
        }),
    ];

    for (i = 0; i < supStyle; i++) {
        styleArray.push(supStyle[i]);
    }

    return  new ol.layer.Vector({
        source: source,
        style: styleArray[0]
    });
}

/**
 * Add possibilities to create and modify points on the map
 * Add functions to features's events
 */
function addPointsControls() {
    //Add the option and the layers wich give the ability to create points on the map.
    this.addPointOption();
    //When a point is updated , call the function "onPointAdded". 
    this.layers.points.getSource().addEventListener('addfeature', this.onPointAdded, false, this);
    //Add controls (update) on an created point (select, move, delete...)
    //After a point is "dragged", call the function "onDragPointComplete"
    //when a (keyboard) key is pressed, delete the point
//    this.controls.updatePoint = new OpenLayers.Control.ModifyFeature(this.layers.points, {
//        'dragComplete': onDragPointComplete,
//        'handleKeypress': deletePoint,
//        'ctx': this
//    }, this);
//    //Add update control in a button and on the map 
//    this.map.addControl(this.controls.updatePoint);
//    this.buttons.updatePoint = this.createButton('Modifier les points', 'updatePoint', this.toggleControl, 'updatePoint');
}

/**
 * Add the option and the layer wich allow to create points.
 * Also set the style of the points.
 */
function addPointOption() {
    var source = new ol.source.Vector();
    this.layers.points = getBasicVectorLayer(source);
    //Add layer to the map
    this.map.addLayer(this.layers.points);

    //Create the "draw line" feature's control and add it to the map and to a button.
    this.controls.addPoint = new ol.interaction.Draw({
        source: source,
        type: 'Point'
    });
    this.map.addInteraction(this.controls.addPoint);

    this.buttons.addPoint = this.createButton('Ajouter des points', 'addPoint', this.toggleControl, 'addPoint');
}

/**
 * Sugar to create simple buttons with no a tooltype, a classname (cls) and a
 * function to call (parametre can be passed as arguments).
 * @param tooltip
 * @param cls
 * @param fn
 * @returns Ext.Button
 */
function createButton(tooltip, cls, fn) {
    var arg = arguments;
    var button = Ext.create('Ext.Button', {
        tooltip: tooltip,
        tooltipType: 'title',
        cls: cls,
        handler: function() {
            fn(arg);
        }
    });
    button.render(Ext.DomQuery.selectNode('#ww_toolbar .buttons'));
    return button;
}

/**
 * Add some buttons and active first the "addLine" control :
 * Button calculate wich set altitude for the points and generate profils.
 * Button displayChart wich juste toglle chartPanel's visibility
 * Button erase wich delete all created features.   
 * Button help wich display a "help and informations page" 
 */
function addButtonsControl() {
    this.buttons.calculate = this.createButton('Générer le profil', 'calculate', this.calculate);
    this.buttons.displayChart = this.createButton('Afficher le graphique', 'displayChart', this.toggleChartVisibility);
    this.buttons.erase = this.createButton('Tout effacer', 'erase', this.eraseAll);
    this.buttons.help = this.createButton('Informations et aide', 'help', function() {
        window.open("./pages/informations.html", "help and informations");
    });
    //Active first the "addLine" control
    toggleControl(['addLine']);
}

/**
 * Toggle activated controls and addclass to corresponding button.
 * @param {array} args arguments
 */
function toggleControl(args) {
    var k;
    for (k in this.controls) {
        this.map.removeInteraction(this.controls[k]);
    }
    for (k in this.buttons) {
        this.buttons[k].removeCls('selected');
    }
    for (k = 0; k < args.length; k++) {
        if (this.controls[args[k]]) {
            this.map.addInteraction(this.controls[args[k]]);
        }
        if (this.buttons[args[k]]) {
            this.buttons[args[k]].addClass('selected');
        }
    }
}

/**
 * Bind events to function.
 * When Line selector's option change, call function 'setSelectedLine'.
 * When speed input change, call function 'setSelectedLine'.
 * When TabPanel's tab change, call function 'setFirstTabTitle'.
 */
function bindEvents() {
    Ext.select('.lineSelector select').on('change', function(e, t, o) {
        this.setSelectedLine(this.profiles[parseInt(t.value)]);
    }, this);
    Ext.select('.properties .speed').on('change', function(e, t, o) {
        this.setSpeed(t.value);
    }, this);
    this.tabPanel.on('tabchange', function(o, tab) {
        this.setFirstTabTitle();
    }, this);
}

/**
 * Toggle chart's Panel visibility
 */
function toggleChartVisibility() {
    if (this.chartPanel.isVisible()) {
        this.chartPanel.hide();
    }
    else {
        this.chartPanel.show();
    }
}

/**
 * Display a wait popup if given parameter is true. Hide it else.
 * @param {Boolean} display
 */
function displayWaitMessage(display) {
    if (display) {
        Ext.Msg.wait("Veuillez patienter", 'Travail en cours');
    }
    else {
        Ext.Msg.hide();
    }
}

/**
 * Delete all create feature and refresh layers.
 * (Reset Wanderwerk)
 */
function eraseAll() {
    Ext.MessageBox.confirm('Tout effacer ?', 'Le tracé ainsi que les points de passage seront définitvement perdus. Êtes-vous sur de vouloir tout effacer ?', function(btn) {
        if (btn === 'yes') {
            while (this.profiles.length > 0) {
                this.profiles[0].destroy();
                this.profiles.splice(0, 1);
            }
            this.profiles.length = 0;
            this.currentProfile = null;
            this.profileDs.removeAll();
            this.compareDs.removeAll();
            this.setSelectedLine();
            this.layers.lines.redraw();
            this.layers.points.redraw();
            toggleControl(['addLine']);
        }
    }, this);
}

/**
 * When a line is added, create a profile, add points in each extremity of the
 * line, and call method 'setSelectedLine'.
 * @param {OpenLayers.Feature.Vector} e
 */
function onLineAdded(e) {
    var profile = new Profile(e.feature, this.generateColor(this.profiles.length + 1), 'Tracé ' + (this.profiles.length + 1)),
            firstPoint, lastPoint;
    this.profiles.push(profile);
    this.setSelectedLine(profile);

    firstPoint = new ol.Feature();
    firstPoint.setGeometry(new ol.geom.Point([0, 0]));

    lastPoint = new ol.Feature();
    lastPoint.setGeometry(new ol.geom.Point([0, 0]));

    this.layers.points.getSource().addFeatures([firstPoint, lastPoint]);

    this.addPoints([
        new Point(firstPoint),
        new Point(lastPoint)
    ]);
//    this.generatePoints(profile, 800);
}

/**
 * Create a unique color for each int number passed. Min 1, max 20.
 * Loop of color like this (then color come darker) :
 * 1 = magenta
 * 2 = cyan
 * 3 = yellow
 * 4 = red
 * 5 = blue
 * @param {int} nLines , a number of line 
 * @returns {String} a hex color.
 */
function generateColor(nLines) {
    var r = 0, g = 0, b = 0, iteration = Math.floor((nLines - 1) / 5);
    switch (nLines - iteration * 5) {
        case 1 : //magenta
            r = 255 - iteration * 64;
            b = 255 - iteration * 64;
            break;
        case 2 : //cyan
            g = 255 - iteration * 64;
            b = 255 - iteration * 64;
            break;
        case 3 : //yellow
            r = 255 - iteration * 64;
            g = 255 - iteration * 64;
            break;
        case 4 : //red
            r = 255 - iteration * 64;
            break;
        case 5 : //blue
            b = 255 - iteration * 64;
            break;
    }
    r = (r <= 0) ? 0 : r;
    g = (g <= 0) ? 0 : g;
    b = (b <= 0) ? 0 : b;
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);
    r = (r.length > 1) ? r : "0" + r;
    g = (g.length > 1) ? g : "0" + g;
    b = (b.length > 1) ? b : "0" + b;
    return '#' + r + g + b;
}

/**
 * Set selected line.
 * If there is no profile, call 'setLinesSelector' with true in parametre and
 * return (reset line Selector).
 * Else call all profiles's methode 'setColor' to hilight current selected
 * profile and set current profile. If profileToSelect is null, select first
 * profile in profiles.
 * If current profile have data, set grid's store with these datas.
 * Call function 'setFirstTabTitle';
 * @param {Profile} profileToSelect
 */
function setSelectedLine(profileToSelect) {
    var i;
    if (this.profiles.length <= 0) {
        this.setLinesSelector(true);
        return;
    }
    this.currentProfile = this.profiles[0];
    for (i = 0; i < this.profiles.length; i++) {
        if (this.profiles[i] === profileToSelect) {
            this.currentProfile = profileToSelect;
        }
        this.profiles[i].setColor(false);
    }
    this.currentProfile.setColor(true);
    if (this.currentProfile.data) {
        this.profileDs.loadData(this.currentProfile.data);
    } else {
        this.profileDs.removeAll();
    }
    this.setLinesSelector(false);
    this.setFirstTabTitle();
}

/**
 * Set options in select "lineSelector" to display all line created.
 * If given boolean is "true" display a special option.
 * @param {Boolean} reset
 */
function setLinesSelector(reset) {
    var i, value = 'default',
            linesSelector = Ext.DomQuery.selectNode('#ww_toolbar .lineSelector select');
    while (linesSelector.length > 0) {
        linesSelector.removeChild(linesSelector[0]);
    }
    if (reset) {
        this.addLinesSelectorOption(value, 'Créez un tracé d\'abord.', '#000000');
        Ext.DomQuery.selectNode('#ww_toolbar .lineSelector select').setAttribute('style', 'color:#000000');
    } else {
        for (i = 0; i < this.profiles.length; i++) {
            if (this.profiles[i] === this.currentProfile) {
                value = i;
                if (this.currentProfile.color) {
                    Ext.DomQuery.selectNode('#ww_toolbar .lineSelector select').setAttribute('style', 'background-color:#DDDDDD; color:' + this.currentProfile.color);
                }
            }
            this.addLinesSelectorOption(i, 'Tracé ' + (i + 1), (this.profiles[i].color || '#000000'));
        }
    }
    Ext.select('.lineSelector select').elements[0].value = value;
}

/**
 * Display name of profile with color of profile as the title of the first tab.
 * If first tab isn't selected, use white color.
 */
function setFirstTabTitle() {
    var value = 'Tracé sélectionné', color = '#FFFFFF';
    if (this.tabPanel.items.items[0] === this.tabPanel.activeTab) {
        if (this.currentProfile) {
            color = this.currentProfile.color;
        }
    }
    if (this.currentProfile) {
        value = this.currentProfile.name;
    }
    Ext.DomQuery.select('.x-tab-bar .x-tab-inner')[0].setAttribute('style', 'color:' + color);
    Ext.DomQuery.select('.x-tab-bar .x-tab-inner')[0].textContent = value;
}

/**
 * Add options in line selected with given value and text.
 * can set style color.
 * @param {number}/{String} value
 * @param {String} text
 * @param {String} color
 */
function addLinesSelectorOption(value, text, color) {
    var linesSelector = Ext.DomQuery.selectNode('#ww_toolbar .lineSelector select'),
            node = document.createElement('option');
    node.setAttribute('value', value);
    if (typeof color === 'string') {
        node.setAttribute('style', 'background-color:#DDDDDD; color:' + color);
    }
    node.appendChild(document.createTextNode(text));
    linesSelector.add(node);
}

/**
 * Control speed in the corresponding input. If speed is less than 1, set speed
 * to 1. If a profile exist, call 'calculateDs' with false parametre (to
 *  recalculate DataStore without get altitude (to economies datas from
 *  geonames)).
 *  Calcul speed only after 500ms and if value if always the same
 *  (to avoid sur-re-calculatation).
 * @param {int} value
 */
function setSpeed(value) {
    if (!parseInt(value) > 0) {
        value = 1;
        Ext.select('.properties .speed').elements[0].value = value;
    }
    setTimeout(function() {
        if (value === Ext.select('.properties .speed').elements[0].value) {
            this.calculateDs(false);
        }
    }, 500, this);
}

function generatePoints(profile, maxInterval) {
    var i = 0, interval = 0, nextInterval, vertices, previousPoint, currentPoint, intervalRatio, generatedPoint, generatedPoints = [], newPointX, newPointY;
    if (!profile.line) {
        return;
    }
    vertices = profile.line.geometry.getVertices();
    previousPoint = profile.line.geometry.getVertices()[0];
    while (vertices[i] !== profile.line.geometry.getVertices()[profile.line.geometry.getVertices().length - 1]) {
        i++;
        previousPoint = vertices[i - 1];
        currentPoint = vertices[i];
        nextInterval = Math.sqrt(Math.pow(currentPoint.x - previousPoint.x, 2) + Math.pow(currentPoint.y - previousPoint.y, 2));
        if ((nextInterval + interval) > maxInterval) {
            intervalRatio = (maxInterval - interval) / nextInterval;
            newPointX = previousPoint.x + (currentPoint.x - previousPoint.x) * intervalRatio;
            newPointY = previousPoint.y + (currentPoint.y - previousPoint.y) * intervalRatio;
            generatedPoint = new Point(new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(newPointX, newPointY)));
            generatedPoint.visibility = false;
            this.addPoint(generatedPoint);
            vertices.splice(i, 0, generatedPoint.feature.geometry.getVertices()[0]);
            interval = 0;
        } else {
            interval += nextInterval;
        }
    }
    this.cleanProfile(profile);
}

/**
 * When a point feature is added (by user), if there is a selected profile, call function 
 * 'addPoints' with given feature. If no profile is selected, display an error 
 * message.
 * @param {OpenLayers.Feature.Vector} e
 */
function onPointAdded(e) {
    var point = e.feature;
    if (!this.currentProfile || !this.currentProfile.line) {
        //remove point
        this.layers.points.getSource().removeFeatures([point]);
        point = null;
        Ext.MessageBox.alert('Le tracé en premier', "Vous devez d'abord créer un nouveau tracé, utilisez le première outils pour cela.");
        return;
    }
    this.displayWaitMessage(true);
    this.addPoints([new Point(point)]);
    this.displayWaitMessage(false);
}

/**
 * Add given features to layer and current profile. Then, call function "cleanProfile"
 * If points is null, return.
 * @param {Array} points Array of OpenLayers.Feature.Vector
 */
function addPoints(points) {
    var i;
    if (!points) {
        return;
    }
    this.displayWaitMessage(true);
    for (i = 0; i < points.length; i++) {
        this.addPoint(points[i]);
    }
    this.cleanProfile(this.currentProfile);
    this.displayWaitMessage(false);
}
;
/**
 * Add the given point to current profile. Don't call function "cleanProfile"
 * If point is null, return.
 * @param {OpenLayers.Feature.Vector} point
 */
function addPoint(point) {
    if (!point) {
        return;
    }
    this.currentProfile.addPoint(point);
}
/**
 * Call 'sortPoint' functuion of the given profile, redraw points layer and remove
 *  profile's datas. If point is null, return.
 * @param {Profile} profile
 */
function cleanProfile(profile) {
    if (!profile) {
        return;
    }
    this.displayWaitMessage(true);
    profile.sortPoints();
    profile.data = null;
    this.displayWaitMessage(false);
}

/**
 * When a line is 'dropped'(after a 'drag'), call function 'replaceAllPoints'
 * and 'sortPoints' of the currentProfile and redraw points layer.
 * @param {OpenLayers.Feature.Vector} e
 */
function onDragLineComplete(e) {
    this.ctx.displayWaitMessage(true);
    this.ctx.currentProfile.replaceAllPoints();
    this.ctx.currentProfile.sortPoints();
    this.ctx.layers.points.redraw();
    this.ctx.displayWaitMessage(false);
}

/**
 * When a point is 'dropped'(after a 'drag'), call function 'replacePoint'
 * and 'sortPoints' of the currentProfile and redraw points layer.
 * @param {OpenLayers.Feature.Vector} e
 */
function onDragPointComplete(e) {
    this.ctx.displayWaitMessage(true);
    this.ctx.currentProfile.replacePoint(e);
    this.ctx.currentProfile.sortPoints();
    this.ctx.layers.points.redraw();
    this.ctx.displayWaitMessage(false);
}

/**
 * if keyboard's key 46 (delete) is pressed, delete the selected point.
 * Redraw points layer.
 * @param {OpenLayers.Feature.Vector} e
 */
function deletePoint(e) {
    var pointToDelete = this.ctx.controls.updatePoint.feature;
    if (e.keyCode === 46) {
        this.ctx.currentProfile.removePoint(pointToDelete);
        this.ctx.layers.points.redraw();
    }
    this.ctx.controls.updatePoint.deactivate(); //@fixme
    this.ctx.controls.updatePoint.activate();
}

/**
 * Request altitude for all points in all profiles.
 * call 'calculateDs' and 'setChart' to Fill data stores and set the chart.
 */
function calculate() {
    this.displayWaitMessage(true);
    ajaxObject.noCurrentProfile++;
    if (this.profiles[ajaxObject.noCurrentProfile - 1] && ajaxObject.error === null) {
        this.profiles[ajaxObject.noCurrentProfile - 1].calculateAltitudes(this);
    } else {
        this.calculateDs(true);
        this.setChart();
        displayWaitMessage(false);
        if (ajaxObject.error !== null) {
            console.log(ajaxObject.error);
        }
        this.resetAjaxObject(ajaxObject);
    }
}

/**
 * Calculate profile data store, compare dataStore and display current profile's
 * datas. If given parameter is true, calcule profile without profile.data.
 * Else, do anything on a profile if it doesn't have data.
 * @param {Boolean} forceCalculate
 */
function calculateDs(forceCalculate) {
    var i, visiblePoints = [];
    if (!this.currentProfile) {
        return;
    }
    displayWaitMessage(true);
    for (i = 0; i < this.profiles.length; i++) {
        if (forceCalculate || this.profiles[i].data) {
            this.profiles[i].data = this.calculateProfileDs(this.profiles[i]);
        }
    }
    //don't load hidden points
    for (i = 0; i < this.currentProfile.points.length; i++) {
        if (this.currentProfile.points[i].visible === true) {
            visiblePoints.push(this.currentProfile.data[i]);
        }
    }
    this.profileDs.loadData(visiblePoints);
    this.compareDs.loadData(this.calculateCompareDs());
    displayWaitMessage(false);
}

/**
 * Calculate datas of a profile and return rows for dataStore.
 * @param {Profile} profile
 * @returns {array} rows
 */
function calculateProfileDs(profile) {
    var i, point, name, speed = Ext.get('speed').getValue(),
            altitude = -1, slope100 = 0, km = 0, kme = 0, percent, duration = 0,
            hours = 0, min = 0, totDuration = 0, totHours = 0, totMin = 0,
            totalKm = 0, totalKme = 0, rows = [];
    for (i = 0; i < profile.points.length; i++) {
        point = profile.points[i];
        altitude = point.altitude;
        if (i !== 0) {
            slope100 = (point.altitude - profile.points[i - 1].altitude) / 100;
            km = ((distanceByALineBetweenTwoPoints(profile.line, profile.points[i - 1], point)) / 1000);
            percent = slope100 / (10 * km) * 100;
            if (percent < -20) {
                kme = -slope100 / 1.5 + km;
            } else {
                if (percent > 0) {
                    kme = km + slope100;
                } else {
                    kme = km;
                }
            }

            duration = kme / speed;
            totDuration += duration;
            hours = Math.floor(duration);
            min = Math.floor((Math.round(100 * (Math.round(duration * 100) / 100 - Math.floor(duration))) / 100) * 60);
            totHours = Math.floor(totDuration);
            totMin = Math.floor((Math.round(100 * (Math.round(totDuration * 100) / 100 - Math.floor(totDuration))) / 100) * 60);
            totalKm += km;
            totalKme += kme;
        }
        name = point.name;
        //create a row for datatable
        rows.push([
            name,
            altitude,
            slope100,
            (km).toFixed(2),
            (kme).toFixed(2),
            hours + ":" + min,
            (totalKm).toFixed(2),
            (totalKme).toFixed(2),
            totHours + ":" + totMin
        ]);
    }
    return rows;
}

/**
 * Compare data of all profile and return result as rows for dataStore.
 * @returns {array} rows
 */
function calculateCompareDs() {
    var i, j, data, last, profile, name, km, kme, altitude, difAltitude, heightMin, heightMax,
            sumDescend = 0, sumAscend = 0, pauses = 0, tmp, tmpWithPauses;
    rows = [];
    for (i = 0; i < this.profiles.length; i++) {
        profile = this.profiles[i];
        data = profile.data;
        if (data && data.length > 0) {
            last = data.length - 1;
            name = '<span style="color:' + profile.color + '">' + profile.name + '</span>';
            km = data[last][6];
            kme = data[last][7];
            heightMin = data[0][1];
            heightMax = data[0][1];
            sumDescend = 0;
            sumAscend = 0;
            for (j = 0; j < data.length; j++) {
                altitude = parseInt(data[j][1]);
                heightMin = (altitude < heightMin) ? altitude : heightMin;
                heightMax = (altitude > heightMax) ? altitude : heightMax;
                if (j >= 1) {
                    difAltitude = altitude - parseInt(data[j - 1][1]);
                    sumDescend += (difAltitude < 0) ? difAltitude : 0;
                    sumAscend += (difAltitude > 0) ? difAltitude : 0;
                }
                //pauses = ?, need pauses
            }
            tmp = data[last][8];
            tmpWithPauses = data[last][8]; //temporary, need pauses
            //create a row for datatable
            rows.push([
                name,
                km,
                kme,
                heightMin,
                heightMax,
                sumDescend,
                sumAscend,
                pauses,
                tmp,
                tmpWithPauses
            ]);
        }
    }
    return rows;
}

/**
 * Set the chart with current profiles's data.
 * Use color of profiles to highlight them.
 */
function setChart() {
    var i, j, data, color;
    if (!this.currentProfile) {
        this.chart.addSeries({data: []}, true);
        return;
    }

    while (this.chart.series.length > 0) {
        this.chart.series[0].remove(false);
    }
    for (i = 0; i < this.profiles.length; i++) {
        data = this.profiles[i].data;
        //add serie
        this.chart.addSeries({
            color: this.profiles[i].color,
            data: []
        }, false);
        //add points
        for (j = 0; j < data.length; j++) {
            color = (this.profiles[i].points[j].visible === true) ? this.profiles[i].color : "#888888";
            this.chart.series[i].addPoint({
                x: parseFloat(data[j][6]),
                y: parseFloat(data[j][1]),
                name: data[j][0],
                color: color,
            }, false);
        }
    }
    this.chart.redraw();
}

/**
 * Calcul distance (in meters) between two given points present on the given
 * line. 
 * @param {OpenLayers.Feature.Vector} line
 * @param {OpenLayers.Feature.Vector} point1
 * @param {OpenLayers.Feature.Vector} point2
 * @returns {int} the distance between two point or -1
 */
function distanceByALineBetweenTwoPoints(line, point1, point2) {
    var i, points = [], pointA, pointB, pointC = point1, vec1, vec2,
            d1, d2, rec = false, firstLoopFirstAdd = false, distance = 0;
    if (!line || !line.geometry || !point1 || !point1.feature || !point2 || !point2.feature) {
        return -1;
    }
    //Put all points on the line between the two given points.
    //This is to calculate the distance between points considering the curves of the line
    for (i = 1; i < line.geometry.getVertices().length; i++) {
        if (rec && !firstLoopFirstAdd) {
            points.push(line.geometry.getVertices()[i - 1]);
        }
        if (firstLoopFirstAdd) {
            firstLoopFirstAdd = false;
        }
        pointA = line.geometry.getVertices()[i - 1];
        pointB = line.geometry.getVertices()[i];
        vec1 = [(pointB.x - pointA.x), (pointB.y - pointA.y)];
        vec2 = [(pointC.feature.geometry.x - pointA.x), (pointC.feature.geometry.y - pointA.y)];
        d1 = vec1[0] * vec2[1];
        d2 = vec1[1] * vec2[0];
        if (Math.round(d1) === Math.round(d2)) { //Math.floor because OpenLayers generates differences of some micro metre
            if (!rec) {
                rec = true;
                points.push(point1.feature.geometry);
                pointC = point2;
                //in case of point2 is on the same segment
                i--;
                firstLoopFirstAdd = true;
            } else {
                rec = false;
                points.push(point2.feature.geometry);
                break;
            }
        }
    }
    for (i = 0; i < points.length - 1; i++) {
        distance += Math.sqrt(Math.pow(points[i + 1].x - points[i].x, 2) + Math.pow(points[i].y - points[i + 1].y, 2));
    }
    return distance;
}


function distanceBetweenTwoPoints(pointPos1, pointPos2) {
    return Math.sqrt(
            Math.pow(Math.abs(pointPos1[0] - pointPos2[0]), 2) +
            Math.pow(Math.abs(pointPos1[1] - pointPos2[1]), 2));
}
;