/**
 * API created by Benjamin Gerber
 * Open source, following the licence "Creative Commons BY-NC"
 * Based on OpenLayers 2.12, GeoExt 1.1, HighCharts 2.3.5, Geonames, GeoAdmin API and
 * Wanderwerk Alpha (created in 2012 by Benjamin Gerber and Nicolas PY as
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
Ext.onReady(function () {
    this.displayWaitMessage(true);
    this.makePanels(); //see ./interfaces.js
    this.setChart();
    this.addMapsControls();
    this.bindEvents();
    this.displayWaitMessage(false);
});

/**
 * Add some controls and layers at the used map
 */
function addMapsControls () {
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
function addLineControls () {
    //Add the option and the layers wich give the ability to draw lines on the map.
    addDrawOption();

    //When a line is updated , call the function "onLineAdded". 
    this.controls.addLine.events.register('featureadded', this, this.onLineAdded);

    //Add controls (update) on an created line (select, move)
    //After a line is "dragged", call the function "onDragLineComplete"
    this.controls.updateLine = new OpenLayers.Control.ModifyFeature(this.layers.lines, {
        'dragComplete': onDragLineComplete,
        'ctx': this
    }, this);
    //Add update control in a button and on the map 
    this.map.addControl(this.controls.updateLine);
    this.buttons.updateLine = this.createButton('Modifier les tracés', 'updateLine', this.toggleControl, 'updateLine');
}

/**
 * Add possibilities to create and modify points on the map
 * Add functions to features's events
 */
function addPointsControls () {
    //Add the option and the layers wich give the ability to create points on the map.
    this.addPointOption();

    //When a point is updated , call the function "onPointAdded". 
    this.controls.addPoint.events.register('featureadded', this, this.onPointAdded);

    //Add controls (update) on an created point (select, move, delete...)
    //After a point is "dragged", call the function "onDragPointComplete"
    //when a (keyboard) key is pressed, delete the point
    this.controls.updatePoint = new OpenLayers.Control.ModifyFeature(this.layers.points, {
        'dragComplete': onDragPointComplete,
        'handleKeypress': deletePoint,
        'ctx': this
    }, this);

    //Add update control in a button and on the map 
    this.map.addControl(this.controls.updatePoint);
    this.buttons.updatePoint = this.createButton('Modifier les points', 'updatePoint', this.toggleControl, 'updatePoint');
}

/**
 * Add the option and the layer wich allow to draw lines.
 * Also set the style of the line.
 */
function addDrawOption () {
    var lineSymbolizer, rules = [], temporaryRedLine, finalRedLine;
    lineSymbolizer = new OpenLayers.Symbolizer.Line({
        strokeWidth: 3,
        strokeColor: "#ff0088"
    });
    rules.push(new OpenLayers.Rule({
        symbolizer: lineSymbolizer
    }));
    temporaryRedLine = new OpenLayers.Style();
    temporaryRedLine.addRules(rules);

    //Add a stylised line layer, final style is defined by line itself
    this.layers.lines = new OpenLayers.Layer.Vector("Edit line layer", {
        styleMap: new OpenLayers.StyleMap({
            "temporary": temporaryRedLine
        })
    }, this);

    //Add layer to the map
    this.map.addLayer(this.layers.lines);

    //Create the "draw line" feature's control and add it to the map and to a button.
    this.controls.addLine = new OpenLayers.Control.DrawFeature(this.layers.lines, OpenLayers.Handler.Path);
    this.map.addControl(this.controls.addLine);
    this.buttons.addLine = this.createButton('Ajouter des tracés', 'addLine', this.toggleControl, 'addLine');
}

/**
 * Add the option and the layer wich allow to create points.
 * Also set the style of the points.
 */
function addPointOption () {
    var pointSymbolizer, rules = [], temporaryPoint, finalPoint;
    pointSymbolizer = new OpenLayers.Symbolizer.Point({
        strokeWidth: 1,
        strokeColor: "#ff0000"
    });
    rules.push(new OpenLayers.Rule({
        symbolizer: pointSymbolizer
    }));
    finalPoint = new OpenLayers.Style();
    finalPoint.addRules(rules);

    temporaryPoint = new OpenLayers.Style();
    finalPoint.addRules(rules);

    //Add a stylised line layer
    this.layers.points = new OpenLayers.Layer.Vector("Edit point layer", {
        styleMap: new OpenLayers.StyleMap({
            "default": finalPoint,
            "temporary": temporaryPoint
        })
    }, this);

    //Add layer to the map
    this.map.addLayer(this.layers.points);

    //Create the "create points" feature's control and add it to the map and to a button.
    this.controls.addPoint = new OpenLayers.Control.DrawFeature(this.layers.points, OpenLayers.Handler.Point);
    this.map.addControl(this.controls.addPoint);
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
function createButton (tooltip, cls, fn) {
    var arg = arguments;
    var button = new Ext.Button({
        tooltip: tooltip,
        tooltipType: 'title',
        cls: cls,
        handler: function () {
            fn(arg);
        }
    });
    button.render(Ext.DomQuery.selectNode('.toolbar .buttons'));
    return button;
}

/**
 * Add some buttons and active first the "addLine" control :
 * Button calculate wich set altitude for the points and generate profils.
 * Button displayChart wich juste toglle chartPanel's visibility
 * Button erase wich delete all created features.   
 */
function addButtonsControl () {
    this.buttons.calculate = this.createButton('Générer le profil', 'calculate', this.calculate);
    this.buttons.displayChart = this.createButton('Afficher le graphique', 'displayChart', this.toggleChartVisibility);
    this.buttons.erase = this.createButton('Tout effacer', 'erase', this.eraseAll);
    this.buttons.help = this.createButton('Informations et aide', 'help', function () {
        alert("L'aide n'est pas encore disponible.");
    });

    //Active first the "addLine" control
    toggleControl(['addLine']);
}

/**
 * Toggle activated controls and addclass to corresponding button.
 * @param {array} args arguments
 */
function toggleControl (args) {
    var k;
    for (k in this.controls) {
        this.controls[k].deactivate();
    }
    for (k in this.buttons) {
        this.buttons[k].removeClass('selected');
    }
    for (k = 0; k < args.length; k++) {
        if (this.controls[args[k]]) {
            this.controls[args[k]].activate();
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
function bindEvents () {
    Ext.select('.lineSelector select').on('change', function (e, t, o) {
        this.setSelectedLine(this.profiles[parseInt(t.value)]);
    }, this);
    Ext.select('.properties .speed').on('change', function (e, t, o) {
        this.setSpeed(t.value);
    }, this);
    this.tabPanel.on('tabchange', function (o, tab) {
        this.setFirstTabTitle();
    }, this);
}

/**
 * Toggle chart's Panel visibility
 */
function toggleChartVisibility () {
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
function displayWaitMessage (display) {
    if (display) {
        Ext.MessageBox.wait("Veuillez patienter", 'Travail en cours');
    }
    else {
        Ext.Msg.hide();
    }
}

/**
 * Delete all create feature and refresh layers.
 * (Reset Wanderwerk)
 */
function eraseAll () {
    Ext.MessageBox.confirm('Tout effacer ?', 'Le tracé ainsi que les points de passage seront définitvement perdus. Êtes-vous sur de vouloir tout effacer ?', function (btn) {
        if (btn === 'yes') {
            while (this.profiles.length > 0) {
                this.profiles[0].destroy();
                this.profiles = this.profiles.slice(1);
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
function onLineAdded (e) {
    var profile = new Profile(e.feature, this.generateColor(this.profiles.length + 1), 'Tracé ' + (this.profiles.length + 1));
    this.profiles.push(profile);
    this.setSelectedLine(profile);
    this.layers.lines.redraw();
    //Generate automaticaly first and last points, add these points to the point layer
    this.addPoint(new Point(new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(0, 0))));
    this.addPoint(new Point(new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(0, 0))));
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
function generateColor (nLines) {
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
function setSelectedLine (profileToSelect) {
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
    this.layers.lines.redraw();
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
function setLinesSelector (reset) {
    var i, value = 'default',
            linesSelector = Ext.DomQuery.selectNode('.toolbar .lineSelector select');
    while (linesSelector.length > 0) {
        linesSelector.removeChild(linesSelector[0]);
    }
    if (reset) {
        this.addLinesSelectorOption(value, 'Créez un tracé d\'abord.', '#000000');
        Ext.DomQuery.selectNode('.toolbar .lineSelector select').setAttribute('style', 'color:#000000');
    } else {
        for (i = 0; i < this.profiles.length; i++) {
            if (this.profiles[i] === this.currentProfile) {
                value = i;
                if (this.currentProfile.color) {
                    Ext.DomQuery.selectNode('.toolbar .lineSelector select').setAttribute('style', 'background-color:#DDDDDD; color:' + this.currentProfile.color);
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
function setFirstTabTitle () {
    var value = 'Tracé sélectionné', color = '#FFFFFF';
    if (this.tabPanel.items.items[0] === this.tabPanel.activeTab) {
        if (this.currentProfile) {
            color = this.currentProfile.color;
        }
    }
    if (this.currentProfile) {
        value = this.currentProfile.name;
    }
    Ext.select('.x-tab-strip .x-tab-strip-text').elements[0].setAttribute('style', 'color:' + color);
    Ext.select('.x-tab-strip .x-tab-strip-text').elements[0].textContent = value;

}

/**
 * Add options in line selected with given value and text.
 * can set style color.
 * @param {number}/{String} value
 * @param {String} text
 * @param {String} color
 */
function addLinesSelectorOption (value, text, color) {
    var linesSelector = Ext.DomQuery.selectNode('.toolbar .lineSelector select'),
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
function setSpeed (value) {
    if (!parseInt(value) > 0) {
        value = 1;
        Ext.select('.properties .speed').elements[0].value = value;
    }
    setTimeout(function () {
        if (value === Ext.select('.properties .speed').elements[0].value) {
            this.calculateDs(false);
        }
    }, 500, this);
}

/**
 * When a point feature is added, if there is a selected profile, call function 
 * 'addPoint' with given feature. If no profile is selected, display an error 
 * message.
 * @param {OpenLayers.Feature.Vector} e
 */
function onPointAdded (e) {
    var point = e.feature;
    if (!this.currentProfile || !this.currentProfile.line) {
        point.destroy();
        Ext.MessageBox.alert('Le tracé en premier', "Vous devez d'abord créer un nouveau tracé, utilisez le première outils pour cela.");
        return;
    }
    this.displayWaitMessage(true);
    this.addPoint(new Point(point));
    this.displayWaitMessage(false);
}

/**
 * Add the feature to layer, add point to current profile, call 'sortPoint' of
 * this profile, redraw points layer and remove profile datas. If point is
 *  null, return.
 * @param {OpenLayers.Feature.Vector} point
 */
function addPoint (point) {
    if (!point) {
        return;
    }
    this.displayWaitMessage(true);
    this.layers.points.addFeatures(point.feature);
    this.currentProfile.addPoint(point);
    this.currentProfile.sortPoints();
    this.currentProfile.data = null;
    this.layers.points.redraw();
    this.displayWaitMessage(false);
}

/**
 * When a line is 'dropped'(after a 'drag'), call function 'replaceAllPoints'
 * and 'sortPoints' of the currentProfile and redraw points layer.
 * @param {OpenLayers.Feature.Vector} e
 */
function onDragLineComplete (e) {
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
function onDragPointComplete (e) {
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
function deletePoint (e) {
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
function calculate () {
    this.displayWaitMessage(true);
    ajaxObject.noCurrentProfile++;
    if (this.profiles[ajaxObject.noCurrentProfile - 1]) {
        this.profiles[ajaxObject.noCurrentProfile - 1].calculateAltitudes(this);
    } else {
        ajaxObject.noCurrentProfile = 0;
        this.calculateDs(true);
        this.setChart();
    }
    displayWaitMessage(false);
}

/**
 * Calculate profile data store, compare dataStore and display current profile's
 * datas. If given parameter is true, calcule profile without profile.data.
 * Else, do anything on a profile if it doesn't have data.
 * @param {Boolean} forceCalculate
 */
function calculateDs (forceCalculate) {
    var i;
    if (!this.currentProfile) {
        return;
    }
    displayWaitMessage(true);
    for (i = 0; i < this.profiles.length; i++) {
        if (forceCalculate || this.profiles[i].data) {
            this.profiles[i].data = this.calculateProfileDs(this.profiles[i]);
        }
    }
    this.profileDs.loadData(this.currentProfile.data || []);
    this.compareDs.loadData(this.calculateCompareDs());
    displayWaitMessage(false);
}

/**
 * Calculate datas of a profile and return rows for dataStore.
 * @param {Profile} profile
 * @returns {array} rows
 */
function calculateProfileDs (profile) {
    var i, point, name, speed = Ext.get('speed').getValue(),
            altitude = -1, slope100 = 0, km = 0, kme = 0, percent, duration = 0,
            hours = 0, min = 0, totDuration = 0, totHours = 0, totMin = 0,
            totalKm = 0, totalKme = 0, rows = [];
    for (i = 0; i < profile.points.length; i++) {
        point = profile.points[i];
        altitude = point.altitude;
        if (i !== 0) {
            slope100 = (point.altitude - profile.points[i - 1].altitude) / 100;
            km = ((distanceBetweenTwoPoints(profile.line, profile.points[i - 1], point)) / 1000);
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
function calculateCompareDs () {
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
function setChart () {
    var i, j, data;

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
            this.chart.series[i].addPoint({
                x: parseFloat(data[j][6]),
                y: parseFloat(data[j][1]),
                name: data[j][0],
                color: this.profiles[i].color
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
function distanceBetweenTwoPoints (line, point1, point2) {
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