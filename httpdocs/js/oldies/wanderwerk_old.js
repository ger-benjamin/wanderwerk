/**
 * API Cr�er par Benjamin Gerber et Nicolas Py.
 * COMEM 2012, HEIG_VD.
 * Sources libre, suivant les r�gles "Creative Commons BY-NC"
 * Bas� sur les librairies OpenLayers, et GeoExt.
 */

//ci-dessous, Les variables globales qui changent souvent mais qui ne doivent pas
//changer de type ou/et qui doivent �tre initialis�s explicitement

var path = "images/wanderwerk/";

/**
 * le feature de la ligne pr�sente sur le trac�. Doit �tre unique.
 * type : feature
 */
var the_line = null;

/**
 * points cr�er par l'utilisateur
 * type : array[feature]
 */
var points = [];

/**
 * tableau avec deux colonnes :
 * Coordonn�es (venant de feature.geometry).
 * booleans indiquant si le point est d�finit par l'utilisateur ou cr�e avec la ligne.
 * type : array[geometry, boolean]
 **/
var allPoints = [];

/**
 * Coordonn�es des points s�lections (venant de feature.geometry).
 * type : array[geometry]
 **/
var importantPoints = [];

/**
 * Distance entre chaque points cr�� par l'utilisateur.
 * type : array[int]
 */
var distances = [];

/**Un tableau d'identifiant de chaque point et du nom de chaque point'
 * type : array[{string, string}]
 */
var pointsName = [];

//Point d'entr�e du script
Ext.onReady(function () {
    displayWaitMessage(true);
    makePanels();
    addMapsControls();
    displayWaitMessage(false);
});

/**
 * Make Ext panels and set centent
 */
function makePanels () {
    var apiST, mapPanel;
    //----------------------avec Swiss topo-----------------------------------
    //Api SwissTopo
    apiST = new GeoAdmin.API({lang: 'fr'});

    //Map SwissTopo
    map = apiST.createMap({//Cr�e une carte Swiss Topo
        layers: "ch.swisstopo.pixelkarte-farbe, test",
        easting: 600000,
        northing: 200000
    });

    //Panel Ext contenant la map
    mapPanel = new GeoExt.MapPanel({
        title: "Carte Swiss Topo 1:25'000",
        region: 'center',
        split: false,
        map: map,
        zoom: 4
    });


//--------------avec OSM (bugu� actuellement, mesures incorectes)--------------
//
//    var options = {
//        controls: [],
//        projection: new OpenLayers.Projection("EPSG:21781"),
//        maxExtent: new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508),
//        displayProjection: new OpenLayers.Projection("EPSG:21781"),
//        units: 'm'
//    };
//
//    map = new OpenLayers.Map('map', options);
//    
//    //Panel Ext contenant la map
//    var mapPanel = new GeoExt.MapPanel({
//        title: "Carte Open Street Map",
//        region: 'center',
//        split: false,
//        map: map,
//        zoom:4
//    });
//    
//    map.addLayer(new OpenLayers.Layer.OSM());
//    map.setCenter(new OpenLayers.LonLat(788600,5950171),4);
//    map.addControl(new OpenLayers.Control.Navigation());
//    map.addControl(new OpenLayers.Control.PanZoom());
//    map.addControl(new OpenLayers.Control.ScaleLine());
//
//----------------------------------------------------------------------------

    var htmlDataWest = '<table id="dataWest">'
            + '<tr><td><label for="title">Titre : </label></td><td><input id="titre" type="text" name="title" /></td></tr>'
            + '<tr><td><label for="author">R�alis� par : </label></td><td><input id="author" type="text" name="author" /></td></tr>'
            + '<tr><td><label for="maps">Cartes topographiques : </label></td><td><input id="maps" type="text" name="maps" /></td></tr>'
            + '</table>';

    var htmlDataEast = '<table id="dataEast">'
            + '<tr><td><label for="dateS">Date de d�but : </label></td><td><input id="dateS" type="date" name="dateS" /></td></tr>'
            + '<tr><td><label for="dateE">Date de fin : </label></td><td><input id="dateE" type="date" name="dateE" /></td></tr>'
            + '<tr><td><label for="speed">Facteur de vitesse(kme/h)�: </label></td><td><input id="speed" type="number" name="speed" value="4" /></td></tr>'
            + '</table>';

    var panelDataEast = new Ext.Panel({
        region: 'center',
        width: 400,
        html: htmlDataEast
    });

    var panelDataWest = new Ext.Panel({
        region: 'west',
        width: 400,
        html: htmlDataWest
    });

    var dataPanels = new Ext.Panel({
        layout: 'border',
        region: 'north',
        height: 90,
        items: [
            panelDataEast,
            panelDataWest
        ]
    });

    //cr�atio du store
    makeStore();

    var gridPanel = new Ext.grid.GridPanel({
        store: ds,
        colModel: colModel,
        height: 200,
        region: 'center'
    });

    var htmlGraph = '<div id="chartcontainer"><img src="' + this.path + 'chart_defaut.png" alt="graphique vide" /></div>';

    graph = new Ext.Window({
        width: 500,
        height: 350,
        title: "Profil altimetrique",
        html: htmlGraph,
        closable: false
    });
    graph.show();
    graph.hide();

    //conteneur pour panels d'informations'
    var dataPanel = new Ext.Panel({
        title: 'Informations',
        layout: 'border',
        region: 'south',
        height: 300,
        split: true,
        autoScroll: true,
        items: [
            dataPanels,
            gridPanel
        ]
    });

    //Agence et affiche les panels
    var viewPort = new Ext.Viewport({
        layout: 'border',
        rendreTo: Ext.getBody(),
        items: [
            dataPanel,
            mapPanel
        ]
    });
}

/**
 *Cr�e le tableau et son format ou s'inscriront les donn�es
 */
function makeStore () {
    // create the data store for the table
    ds = new Ext.data.ArrayStore({
        fields: [
            {
                name: 'nom'
            },
            {
                name: 'alt',
                type: 'int'
            },
            {
                name: 'deniv100',
                type: 'float'
            },
            {
                name: 'km',
                type: 'float'
            },
            {
                name: 'kme',
                type: 'float'
            },
            {
                name: 'tmp'
            },
            {
                name: 'kmTotal',
                type: 'float'
            },
            {
                name: 'kmeTotal',
                type: 'float'
            },
            {
                name: 'tmpTot'
            }
        ]
    });
    // create the colum Manager
    colModel = new Ext.grid.ColumnModel([
        {
            header: 'Nom',
            width: 180,
            sortable: false,
            dataIndex: 'nom'
        },
        {
            header: 'Altitude [m]',
            width: 100,
            sortable: false,
            dataIndex: 'alt'
        },
        {
            header: 'D�nivel� par 100m [m/hm]',
            width: 100,
            sortable: false,
            dataIndex: 'deniv100'
        },
        {
            header: 'Distance [km]',
            width: 100,
            sortable: false,
            dataIndex: 'km'
        },
        {
            header: 'Km-efforts [km]',
            width: 100,
            sortable: false,
            dataIndex: 'kme'
        },
        {
            header: 'Temps [h:m]',
            width: 100,
            sortable: false,
            dataIndex: 'tmp'
        },
        {
            header: 'Distance Totale [km]',
            width: 100,
            sortable: false,
            dataIndex: 'kmTotal'
        },
        {
            header: 'Km-efforts totaux [km]',
            width: 100,
            sortable: false,
            dataIndex: 'kmeTotal'
        },
        {
            header: 'Temps Total [h:m]',
            width: 100,
            sortable: false,
            dataIndex: 'tmpTot'
        }
    ]);
}

/**
 * Ajoute des controls et des couches � la map.
 */
function addMapsControls () {

    //Ajoute un switcher de couche
//    map.addControl(new OpenLayers.Control.LayerSwitcher());

    //Ajoute des controles par clavier
    //map.addControl(new OpenLayers.Control.KeyboardDefaults());

    //Ajoute l'option et la couche permettant de dessiner le trac�.
    addOptionDessin(map);

    //ajout le contr�le du trac� d�j� cr�er (s�lection, suppression...)
    updateLineControl = new OpenLayers.Control.ModifyFeature(
            lineLayer,
            {
                'dragComplete': onDragLineComplete
            }
    );
    map.addControl(updateLineControl);

    //Ajoute l'option et la couche permettant d'ajouter des points.
    addOptionPoint(map);

    //ajout le contr�le des points d�j� cr�er (s�lection, suppression...)
    //red�finit l'action lors du "drop" lorsqu'un point a �t� d�plac�.
    //red�finit la touche delete pour effacer un point.
    updatePointControl = new OpenLayers.Control.ModifyFeature(
            pointLayer,
            {
                'standAlone': false,
                'dragComplete': onDragPointComplete,
                'handleKeypress': deletePoint
            }
    );
    map.addControl(updatePointControl);

    //ajoute les boutons de controle
    addControls(map);

    //lors de l'arr�t d'�dition d'une ligne, appelle la fonction "onLineAdded"
    addLineControl.events.register('featureadded', addLineControl, onLineAdded);

    //lors de l'arr�t d'�dition d'une ligne, appelle la fonction "onPointAdded"
    addPointControl.events.register('featureadded', addPointControl, onPointAdded);
}

/**
 * Ajoute l'option et la couche permettant de dessiner le trac�.
 * L'objet map doit d�j� �tre initialis�
 * @param OpenLayerMap, la map sur laquelle ajout� le controle et le layer
 */
function addOptionDessin (OpenLayerMap) {
    var lineSymbolizer = new OpenLayers.Symbolizer.Line({
        strokeWidth: 3,
        strokeColor: "#ff0088"
    });
    var rule = new OpenLayers.Rule({
        symbolizer: lineSymbolizer
    });
    var temporaryRedLine = new OpenLayers.Style();
    temporaryRedLine.addRules([rule]);

    lineSymbolizer = new OpenLayers.Symbolizer.Line({
        strokeWidth: 3,
        strokeColor: "#ff0000"
    });
    rule = new OpenLayers.Rule({
        symbolizer: lineSymbolizer
    });
    var finalRedLine = new OpenLayers.Style();
    finalRedLine.addRules([rule]);

    lineLayer = new OpenLayers.Layer.Vector("Edit line layer", {
        styleMap: new OpenLayers.StyleMap({
            "default": finalRedLine,
            "temporary": temporaryRedLine
        })
    });
    OpenLayerMap.addLayer(lineLayer);

    addLineControl = new OpenLayers.Control.DrawFeature(lineLayer, OpenLayers.Handler.Path);
    OpenLayerMap.addControl(addLineControl);
}

/**
 * Ajoute l'option et la couche permettant de dessiner des points.
 * L'objet map doit d�j� �tre initialis�
 * @param OpenLayerMap, la map sur laquelle ajout� le controle et le layer
 */
function addOptionPoint (OpenLayerMap) {
    var pointSymbolizer = new OpenLayers.Symbolizer.Point({
        strokeWidth: 1,
        strokeColor: "#ff0000"
    });
    var rule = new OpenLayers.Rule({
        symbolizer: pointSymbolizer
    });
    var finalPoint = new OpenLayers.Style();
    finalPoint.addRules([rule]);

    var temporaryPoint = new OpenLayers.Style();
    finalPoint.addRules([rule]);

    pointLayer = new OpenLayers.Layer.Vector("Edit point layer", {
        styleMap: new OpenLayers.StyleMap({
            "default": finalPoint,
            "temporary": temporaryPoint
        })
    });
    OpenLayerMap.addLayer(pointLayer);

    addPointControl = new OpenLayers.Control.DrawFeature(pointLayer, OpenLayers.Handler.Point);
    OpenLayerMap.addControl(addPointControl);
}

/**
 * Ajoute une "couche" contenant diff�rent controle
 * L'objet map doit d�j� �tre initialis�
 * @param OpenLayerMap, la map sur laquelle ajout� les controle
 */
function addControls (OpenLayerMap) {
    controlLayers = [
        addLineControl,
        updateLineControl,
        addPointControl,
        updatePointControl
    ];

    //cr�e une "couche" de controle et s�lectionne le bouton "boutonTrace"                                                                                                                      
    controlPanel = new OpenLayers.Control.Panel();

    //cr�e le boutons add trace
    var buttonAddLine = new OpenLayers.Control.Button({
        trigger: function () {
            toggleControl(0);
        },
        title: "Cr�er un cheminement.",
        displayClass: "buttonAddLine"
    });
    //cr�e le boutons update trace
    var buttonUpdateLine = new OpenLayers.Control.Button({
        trigger: function () {
            toggleControl(1);
            //selectPointControl.deactivate();
        },
        title: "Modifier le cheminement.",
        displayClass: "buttonUpdateLine"
    });
    //cr�e le bouton add point                      
    var buttonAddPoint = new OpenLayers.Control.Button({
        trigger: function () {
            toggleControl(2);
        },
        title: "Ajouter des points de passage.",
        displayClass: "buttonAddPoint"
    });
    //cr�e le update point                      
    var buttonUpdatePoint = new OpenLayers.Control.Button({
        trigger: function () {
            toggleControl(3);
        },
        title: "Editer les points de passage.",
        displayClass: "buttonUpdatePoint"
    });
    //cr�e le bouton calculation                      
    var buttonCalcul = new OpenLayers.Control.Button({
        trigger: function () {
            setPointName();
            beforCalculPath();
        },
        title: "G�n�rer le profil.",
        displayClass: "buttonCalcul"
    });
    //cr�e le bouton graph                    
    var buttonGraph = new OpenLayers.Control.Button({
        trigger: function () {
            if (graph.isVisible()) {
                graph.hide();
            }
            else {
                graph.show();
            }
        },
        title: "Afficher le profil altim�trique",
        displayClass: "buttonGraph"
    });
    //cr�e le bouton erase all                      
    var buttonReset = new OpenLayers.Control.Button({
        trigger: function () {
            eraseAll();
        },
        title: "Tout effacer.",
        displayClass: "buttonReset"
    });
    //cr�e le bouton help                     
    var buttonHelp = new OpenLayers.Control.Button({
        trigger: function () {
            displayHelp();
        },
        title: "Afficher l'aide",
        displayClass: "buttonHelp"
    });

    //ajoute les controles
    controlPanel.addControls(
            [
                buttonAddLine,
                buttonUpdateLine,
                buttonAddPoint,
                buttonUpdatePoint,
                buttonCalcul,
                buttonGraph,
                buttonReset,
                buttonHelp
            ]
            );
    OpenLayerMap.addControl(controlPanel);

    //active le bouton "boutonTrace" en premier
    toggleControl(0);

}

/**
 * Permet de changer le control et son bouton actuellement actif
 * en d�sactivant tout les autres. d�selectionne les entit�s selectionn�es.
 * Les boutons doivent �tre dans un tableau dans "controlPanel.controls[]" 
 * Les controls doivent �tre dans un tableau dans "controlLayers[]" 
 * @param controlNo, le num�ro de place dans les tableau du controle � activer.
 */
function toggleControl (controlNo) {
    for (var currentControl = 0; currentControl < controlLayers.length; currentControl++) {
        controlLayers[currentControl].deactivate();
        controlPanel.controls[currentControl].deactivate();
    }
    controlLayers[controlNo].activate();
    controlPanel.controls[controlNo].activate();
}

/**
 * Permet d'affiche une popup qui demande d'attendre.
 * Le script continue son execution en attendant.
 * @param display, boolean � true si il faut afficher le popup, false pour le cacher.
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
 * Affiche une popup qui contient la marche a suivre pour utiliser ce site.
 */
function displayHelp () {
    var helpHtml = "<div id='help'>"
            + "<p>Sept outils sont � votre disposition pour tracer votre profil de marche.</p>"
            + "<div>"
            + "<h3>Outil de cheminement : </h3>"
            + "<p class='floatLeft'>Permet de tracer votre route, maintener 'shift' pour dessiner simplement. "
            + "Attention, un seul chemin peut-�tre cr�e "
            + "mais ce dernier peut �tre modifi� (outil de modification du cheminement) "
            + "ou supprim� (corbeille).</p>"
            + "<img src='" + this.path + "addLine.png'  alt='Ligne' width='36' height='36' />"
            + "</div><div>"
            + "<h3>Outil de modification du cheminement : </h3>"
            + "<p>Avec cette option, cliquez sur votre trac� pour l'�diter (il devient "
            + "bleu). A ce moment, cliquer sur les nouveaux points pour bouger les "
            + "contours du trac�.</p>"
            + "<img src='" + this.path + "updateLine.png'  alt='Ligne' width='36' height='36' />"
            + "</div><div>"
            + "<h3>Outil d'ajout de points : </h3>"
            + "<p>Permet d'ajouter des points de passage sur le trac�. Attention, le "
            + "calcul de l'altitude se fera uniquement sur ces points. Veillez-donc � "
            + "placer des points apr�s et avant chaque changement important d'altitude.</p>"
            + "<img src='" + this.path + "addPoint.png'  alt='Ligne' width='36' height='36' />"
            + "</div><div>"
            + "<h3>Outil de modification de points : </h3>"
            + "<p>Avec cette option, cliquez sur un point pour le s�lectionner. "
            + "Lorsqu'un point est s�lectionn�, il est possible de le bouger par "
            + "'drag&drop'. Cliquer sur la touche 'Delete' du clavier pour supprimer ce point. "
            + "Le premier et le dernier points ne sont jamais modifiable.</p>"
            + "<img src='" + this.path + "updatePoint.png'  alt='Ligne' width='36' height='36' />"
            + "</div><div>"
            + "<h3>Calculatrice : </h3>"
            + "<p>Permet de lancer les calculs qui rempliront le tableau de donn�es. "
            + "Vous devrez attendre si votre parcours poss�de plus de 20 points. "
            + "Si l'altitude affiche -9999, attendez un moment (20 secondes) et relancez le calcul. "
            + "Ces deux derniers inconvenients viennent du fait que le syst�me qui r�cup�re "
            + "l'altitude se base sur une version gratuite de l'API GeoNames</p>"
            + "<img src='" + this.path + "calcul.png'  alt='Ligne' width='36' height='36' />"
            + "</div><div>"
            + "<h3>Graphique : </h3>"
            + "<p>Affiche ou cache le graphique du profil altim�trique.</p>"
            + "<img src='" + this.path + "graph.png'  alt='Ligne' width='36' height='36' />"
            + "</div><div>"
            + "<h3>Corbeille : </h3>"
            + "<p>Supprime le trac� et chaque point d'int�r�t, r�initialise le tableau. "
            + "Attention, ce choix est d�finitif.</p>"
            + "<img src='" + this.path + "corbeille.png'  alt='Ligne' width='36' height='36' />"
            + "</div><div>"
            + "<h3>Divers : </h3>"
            + "<p>Vous pouvez changer la vitesse du parcours en changeant le champs "
            + "'vitesse' dans 'informations' (les vitesses �gales ou inf�rieures � z�ro sont exclues).</p>"
            + "<p>Vous pouvez changer le nom d'un point en cliquant sur sa case dans le "
            + "tableau situ� dans 'informations'.</p>"
            + "<p>Utilisez la fonction d'impression de votre navigateur pour imprimer "
            + "votre profil de marche.</p>"
            + "<p>Maintener un click et bouger la souris pour vous mouvoir sur la carte, "
            + "ceci marche �galement lorsque vous dessiner une ligne.</p>"
            + "</div><div>";
    Ext.Msg.show({
        title: 'Aide point par point',
        msg: helpHtml
    });
}

/**
 * Permet d'effacer tous �l�ments vectoriels pr�sents sur la map (lignes/points).
 */
function eraseAll () {
    Ext.MessageBox.confirm('Tout effacer ?', 'Le trac� ainsi que les points de passage seront d�finitvement perdus. �tes-vous sur de vouloir tout effacer ?', function (btn) {
        if (btn === 'yes') {
            lineLayer.removeAllFeatures();
            lineLayer.redraw();
            pointLayer.removeAllFeatures();
            pointLayer.redraw();
            the_line = null;
            points = [];
            allPoints = [];
            importantPoints = [];
            distances = [];
            pointsName = [];
            ds.removeAll();
        }
    });
}

/**
 *  Enregistre le trac�
 *  Cr�er automatiquement un point au d�but et � la fin du trac�
 *  @param e le trac�
 */
function onLineAdded (e) {
    if (the_line !== null) {
        e.feature.destroy();
        Ext.MessageBox.alert('Pas de doublon', "Vous ne pouvez cr�er qu'un trac� � la fois.");
    }
    else {
        the_line = e.feature;
        //Ajoute un point au d�but de la ligne
        var startX = the_line.geometry.getVertices()[0].x;
        var startY = the_line.geometry.getVertices()[0].y;
        var startPoint = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(startX, startY));
        giveNameAtPoint(startPoint.geometry.id, startPoint.geometry.toShortString());
        pointLayer.addFeatures(startPoint);
        movePointToTheLine(startPoint, the_line, pointLayer);
        points[points.length] = startPoint;
        //Ajoute un point � la fin de la ligne
        var lineEndPoint = (the_line.geometry.getVertices().length) - 1;
        var endX = the_line.geometry.getVertices()[lineEndPoint].x;
        var endY = the_line.geometry.getVertices()[lineEndPoint].y;
        var endPoint = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(endX, endY));
        giveNameAtPoint(endPoint.geometry.id, endPoint.geometry.toShortString());
        pointLayer.addFeatures(endPoint);
        movePointToTheLine(endPoint, the_line, pointLayer);
        points[points.length] = endPoint;
    }
}

/**
 *  Ajoute un point seulement si une ligne existe
 *  Replace les points sur la ligne.
 *  @param e le point
 */
function onPointAdded (e) {
    if (the_line === null) {
        e.feature.destroy();
        Ext.MessageBox.alert('Le trac� en premier', "Vous devez d'abord cr�er un nouveau trac�, utilisez l'autre outil pour cela.");
    }
    else {
        var pointAdded = e.feature;
        giveNameAtPoint(pointAdded.geometry.id, pointAdded.geometry.toShortString());
        movePointToTheLine(pointAdded, the_line, pointLayer);
        points[points.length] = pointAdded;
    }
}

/**
 *Ev�nement en fin de modification (drag and drop) de la ligne
 *Replace chaque point sur la ligne qui vient de changer
 */
function onDragLineComplete (e) {
    moveAllPointsToTheLine(points, the_line, pointLayer);
    replaceFirstAndLastPoint();
}

/**
 *Evenement en fin de modification (drag and drop) de points
 *Replace le point sur la ligne (qui est forcement cr�er)
 *set la variable "noPopup" pour activer la cr�ation de popup.
 */
function onDragPointComplete (e) {
    movePointToTheLine(e, the_line, pointLayer);
    replaceFirstAndLastPoint();
}

/**
 *Replace le point sur la ligne (qui est forcement cr�er)
 */
function deletePoint (e) {
    var pointToDelete = updatePointControl.feature;
    if (!(pointToDelete.id === points[0].id || pointToDelete.id === points[1].id))
        if (e.keyCode === 46) {
            //popup.destroy();
            for (var index = 0; index < points.length; index++) {
                if (points[index].id === pointToDelete.id) {
                    Array.remove(points, index);
                    break;
                }
            }
            pointToDelete.destroy();
            updatePointControl.deactivate();
            updatePointControl.activate();
        }
}

/**
 *Permet de centrer le premier et le dernier points de la ligne respectivement
 *au d�but et � la fin de la ligne.
 */
function replaceFirstAndLastPoint () {
    var linePoints = the_line.geometry.getVertices();
    var x1 = linePoints[0].x;
    var y1 = linePoints[0].y;
    var x2 = linePoints[linePoints.length - 1].x;
    var y2 = linePoints[linePoints.length - 1].y;
    points[0].move(new OpenLayers.LonLat(x1, y1));
    points[1].move(new OpenLayers.LonLat(x2, y2));
    pointLayer.redraw();
}

/**
 *Replace automatiquement le point donner sur la partie la plus proche de la
 * ligne donn�. Le derni�re param�tre est le layer des points qu sera redessin�.
 **/
function movePointToTheLine (point, line, pointLayer) {
    var distanceLineToPoint = point.geometry.distanceTo(line.geometry, {
        details: true,
        edge: true
    });
    var dx = distanceLineToPoint.x1 - distanceLineToPoint.x0;
    var dy = distanceLineToPoint.y1 - distanceLineToPoint.y0;
    point.geometry.move(dx, dy);
    pointLayer.redraw();
}

/**
 *Replace automatiquement chaque pointsur la partie la plus proche de la
 * ligne.
 **/
function moveAllPointsToTheLine (points, line, pointLayer) {
    for (var pointNo = 0; pointNo < points.length; pointNo++) {
        movePointToTheLine(points[pointNo], line, pointLayer);
    }
}

/**
 * Permet de convertir des coordonn�es au format EPSG 21781 au format LongLat (EPSG 4326)
 * @param tab_coordonnees, un tableau de coordonn�e XY (exemple : [[200, 600], [540, 600]] )
 * return un tableau des m�me coordonn�es que donn�e en param�tre mais en projection EPSG 34326 (lonLat)
 */
function ConvertCHPositionToLongLat (tab_coordonnees) {
    var lonLats = [];
    for (var elementNo = 0; elementNo < tab_coordonnees.length; elementNo++) {
        lonLat = OpenLayers.LonLat.fromArray(tab_coordonnees[elementNo]);
        lonLat.transform(new OpenLayers.Projection('EPSG:21781'), new OpenLayers.Projection('EPSG:4326'));
        lonLats[elementNo] = [lonLat.lon, lonLat.lat];
    }
    console.log(tab_coordonnees);
    console.log(lonLats);
    return lonLats;
}

/**
 *Set les variables utiles � getAltitudes.
 *Affiche un meesage d'attente.
 */
function beforeGetAltitudes () {
    iterations = 0;
    allAltitudes = [];
    cloneOfimportantPoints = importantPoints.clone();
    displayWaitMessage(true);
    getAltitudes();
}

/**
 *Appeler la m�thode "beforeGetAltitudes" plut�t que cette m�thode directement.
 *Permet de r�cup�rer des altitudes en appellant la m�thode "recupDonnees".
 *Appelle autant de fois la m�thode "recupDonnees" qu'il y a de tzranche de 
 *20 points dans la variable cloneOfimportantPoints;
 *Ceci �vite de devoir souscrire un compte payant � GeoNames.
 */
function getAltitudes () {
    iterations++;
    partOfcloneOfimportantPoints = [];
    if (cloneOfimportantPoints.length > 0) {
        if (cloneOfimportantPoints.length <= 20) {
            partOfcloneOfimportantPoints = cloneOfimportantPoints.clone(0);
            cloneOfimportantPoints = [];
            if (iterations === 1) {
                getAltitudesDatas();
            }
            else {
                setTimeout("getAltitudesDatas()", 20000);
            }
        }
        else {
            partOfcloneOfimportantPoints = cloneOfimportantPoints.splice(0, 20);
            if (iterations === 1) {
                getAltitudesDatas();
            }
            else {
                setTimeout("getAltitudesDatas()", 20000);
            }
        }
    }
    else {
        enregistrerDonnees(allAltitudes);
        creeProfil(allAltitudes);
        displayWaitMessage(false);
    }
}

/**
 *Fonction pour r�cup�rer l'altitude avec le service geoname. 
 *Appelle la methode "recupAltitudes" apr�s traitement (ou lance un message d'erreur)
 *Attention : renvoie -9999 en cas d'erreur du c�t� de geonames
 */
function getAltitudesDatas () {
    var req = "php/proxy.php?nb=" + partOfcloneOfimportantPoints.length;
    var pointslonglat = [];
    for (var i = 0; i < partOfcloneOfimportantPoints.length; i++) {
        pointslonglat[i] = [partOfcloneOfimportantPoints[i][0].x, partOfcloneOfimportantPoints[i][0].y];
    }
    var mypoints = ConvertCHPositionToLongLat(pointslonglat);
    for (i = 0; i < mypoints.length; i++) {
        req += "&lat" + i + "=" + mypoints[i][1] + "&long" + i + "=" + mypoints[i][0];
    }
    Ext.Ajax.request({
        url: req,
        method: 'GET',
        success: function (result, request) {
            allAltitudes = Array.pushEachElementFromArray(allAltitudes, Ext.decode(result.responseText));
            getAltitudes();
        },
        failure: function (result, request) {
            Ext.MessageBox.alert('Un probl�me est survenue, r�essayer plus tard.');
        }
    });
}

/**
 * Formate puis enregistre les donn�es dans le tableau (gripPanel)
 */
function enregistrerDonnees (result) {
    var vitesse = Ext.get('speed').getValue();
    var altitudes = result;
    var lines = [];
    var deniv100 = 0;
    var km = 0;
    var kme = 0;
    var temps = 0;
    var kmTotal = 0;
    var kmeTotal = 0;
    var heure = 0;
    var min = 0;
    var hm = 0;
    var mintot = 0;
    var mintoh = 0;
    var htot = 0;
    var nom = null;
    for (var i = 0; i < importantPoints.length; i++) {
        //calcul les valeurs devant s'inscrire dans le tableau
        km = distances[i];
        km = Math.round((km / 10)) / 100;
        if (i !== 0 && altitudes[i] !== 0) {
            deniv100 = (altitudes[i] - altitudes[i - 1]) / 100;
            var pourcent = deniv100 / (10 * km) * 100;
            if (pourcent < -20) {
                kme = -deniv100 / 1.5 + km;
            } else {
                if (pourcent > 0) {
                    kme = km + deniv100;
                } else {
                    kme = km;
                }
            }
            kme = Math.round(kme * 100) / 100;
            temps = kme / vitesse;
            heure = Math.floor(temps);
            min = Math.round(100 * (Math.round(temps * 100) / 100 - Math.floor(temps))) / 100;
            min = min * 60;
            min = Math.floor(min);
            hm = lines[i - 1][8].split(":");
            mintoh = (parseInt(hm[1]) + min) / 60;
            mintot = (parseInt(hm[1]) + min) % 60;
            htot = heure + parseInt(hm[0]) + Math.floor(mintoh);
            kmTotal = Math.round((km + lines[i - 1][6]) * 100) / 100;
            kmeTotal = Math.round((kme + lines[i - 1][7]) * 100) / 100;
        }
        //ajuste le nom du Point
        var nomValue = getPointName(importantPoints[i][0].id);
        nom = "<input id='nom_" + importantPoints[i][0].id + "' type='text' name='nom_" + importantPoints[i][0].id + "' value='" + nomValue + "' />";
        //cr�e une ligne de donn�es
        lines[i] = [
            nom,
            altitudes[i],
            deniv100,
            km,
            kme,
            heure + ":" + min,
            kmTotal,
            kmeTotal,
            htot + ":" + mintot
        ];
    }
    //remplit le tableau
    ds.loadData(lines);
}

/**
 *Pr�vient l'utilisateur que le calcul peut-�tre long.
 *Lance le calcul si l'utilisateur appuie sur ok.
 */
function beforCalculPath () {
    var time = Math.floor((points.length / 20)) * 20;
    if (points.length > 20) {
        Ext.MessageBox.confirm('Attention', 'Cette op�ration va prendre au moins ' + time + ' secondes. Continuer ?', function (btn) {
            if (btn === 'yes') {
                calculPath();
            }
        });
    }
    else {
        calculPath();
    }
}

/**
 * Permet de calculer les distances entre chaque points entr�e par utilisateur
 * R�ordonne en m�me temps chaque points dans le sens de la ligne (et non
 * plus dans le sens de cr�ation de chaqu'un des points)
 */
function calculPath () {
    //V�rifie que la valeur de vitesse (obligatoir) est bien remplit.
    //Affiche un message d'erreur sinon
    var speed = Ext.get('speed').getValue();
    if (speed === null || speed <= 0) {
        Ext.MessageBox.alert("Calcules impossibles.", "Vous devez d'abord assigner une vitesse valide (un nombre sup�rieur � z�ro)");
    }
    else {
        //Cr�e un tableau de chaque segment de la ligne
        var pointsDansLaLigne;
        var rec = [];
        for (var i = 0; i < the_line.geometry.getVertices().length; i++) {
            pointsDansLaLigne = [];
            if (i > 0) {
                pointA = the_line.geometry.getVertices()[i - 1];
                pointB = the_line.geometry.getVertices()[i];
                var index = 0;
                for (var j = 0; j < points.length; j++) {
                    var pointC = points[j];
                    var vec1 = [(pointB.x - pointA.x), (pointB.y - pointA.y)];
                    var vec2 = [(pointC.geometry.x - pointA.x), (pointC.geometry.y - pointA.y)];
                    var D1 = vec1[0] * vec2[1];
                    var D2 = vec1[1] * vec2[0];
                    if (Math.floor(D1) === Math.floor(D2)) {
                        pointsDansLaLigne[index] = points[j].geometry;
                        index++;
                    }
                }
                //Ordre chaque point existant sur le segment
                //Algorythme de "trie � bulle".
                for (var x = (pointsDansLaLigne.length - 1); x >= 0; x--) {
                    var temp;
                    for (var y = pointsDansLaLigne.length - 1; y >= 0; y--) {
                        if (pointA.distanceTo(pointsDansLaLigne[y]) < pointA.distanceTo(pointsDansLaLigne[x])) {
                            temp = pointsDansLaLigne[y];
                            pointsDansLaLigne[y] = pointsDansLaLigne[x];
                            pointsDansLaLigne[x] = temp;
                        }
                    }

                }
                //remplit les variables avec les points dans l'ordre
                for (j = 0; j < pointsDansLaLigne.length; j++) {
                    rec[rec.length] = [pointsDansLaLigne[j], true];
                }
            }
            rec[rec.length] = [the_line.geometry.getVertices()[i], false];
        }
        allPoints = rec;
        //efface le store contenant les anciennes donn�es
        if (allPoints.length > 0) {
            ds.removeAll();
        }
        //Calcul la distance entre chaque point
        index = 0;
        var index2 = 0;
        var dist = [];
        dist[0] = 0;
        importantPoints = [];
        for (i = 0; i < allPoints.length; i++) {
            if (allPoints[i][1]) {
                importantPoints[index] = allPoints[i];
                index++;
            }
            if (i > 0) {
                dist[index2] += allPoints[i][0].distanceTo(allPoints[i - 1][0]);
                if (allPoints[i][1]) {
                    index2++;
                    dist[index2] = 0;
                }
            }
        }
        distances = dist;
        //demande la r�cup�ration de l'altitude de chaque point
        beforeGetAltitudes();
    }
}

/**
 * Permet d'assigner un nom � un point identifi� par son ID (geometry.id)
 * Si l'id �tait inconnue, ajoute le point et son nom, met � jour le point sinon.
 * @param id, l'id du point (feature.geometry.id)
 * @param name, le nom voulu du point.
 */
function giveNameAtPoint (id, name) {
    var newName = {
        "id": id,
        'name': name
    };
    var exist = false;
    if (pointsName.length > 0) {
        for (var index = 0; index < pointsName.length; index++) {
            if (pointsName[index].id === id) {
                pointsName[index].name = name;
                exist = true;
            }
        }
    }
    if (!exist)
        pointsName.push(newName);
}

/**
 * Permet de rendre le nom d'un point en fonction de son id.
 * si le point est inconnu return "Point inconnu."
 */
function getPointName (id) {
    var name = null;
    for (var index = 0; index < pointsName.length; index++) {
        if (pointsName[index].id === id) {
            name = pointsName[index].name;
        }
    }
    if (name === null) {
        name = 'Point inconnu.';
    }
    return name;
}

/**
 * Permet de changer le nom des points existants pour le remplacer par le nom
 * trouv� en cherchant l'id "nom_idDuPoint" dans le dom.
 * idDuPoint �gale feature.geometry.id 
 */
function setPointName () {
    for (var index = 0; index < pointsName.length; index++) {
        var inputElement = Ext.get("nom_" + pointsName[index].id);
        if (inputElement !== null) {
            giveNameAtPoint(pointsName[index].id, inputElement.getValue());
        }
    }
}

/**
 * Permet de g�n�rer le profil altim�trique
 * Repris du projet profiler
 * @param result, le resultat de la requ�te chez geonames (altitudes)
 */
function creeProfil (result) {
    var altitudes = result;
    var myData = [];
    var distance = 0;
    for (var index = 0; index < altitudes.length; index++) {
        distance += distances[index] / 1000;
        myData[index] = new Array(distance, parseInt(altitudes[index]));
    }
    // fonctionne seulement avec les graphes de type 'bar'
    //var myData = [['unit', 20], ['unit two', 10], ['unit three', 30], ['other unit', 10], ['last unit', 30]];
    var myChart = new JSChart('chartcontainer', 'line');
    myChart.setDataArray(myData);
    myChart.setBackgroundColor('#efe');// couleur du background
    myChart.setAxisNameX('Distance en km');// nom du l'axe X
    myChart.setAxisNameY('Altitude');// nom de l'axe Y
    myChart.setAxisPaddingLeft(60);
    myChart.setAxisPaddingRight(20);
    myChart.setAxisPaddingTop(50);
    myChart.setAxisPaddingBottom(40);
    myChart.setTextPaddingBottom(5);
    myChart.setSize(500, 321);// taile du graphe (largeur - hauteur)
    myChart.setTitle('Profil altimetrique');// titre du graphe
    myChart.setTitleColor('#5555AA');// couleur du titre du graphe
    myChart.setTitleFontSize(10);// taille de la police titre

    myChart.setFlagColor('#b40502');
    myChart.setFlagRadius(4);
    for (var i = 0; i < altitudes.length; i++) {
        myChart.setTooltip([distances[i], altitudes[i] + 'm']);
    }
    myChart.setBackgroundImage(this.path + 'chart_bg.png');
    // d'autres options sont disponibles � l'adresse suivante www.jscharts.com/how-to-use-examples-line
    myChart.draw();
}

// Array Remove - By John Resig (MIT Licensed)
Array.remove = function (array, from, to) {
    var rest = array.slice((to || from) + 1 || array.length);
    array.length = from < 0 ? array.length + from : from; //
    return array.push.apply(array, rest);
};

/**
 * Permet d'ajouter chaque �l�ment d'un tableau � un autre tableau.
 * @param arrayToBeFilled le tableu � compl�ter.
 * @param elements le tableau d'�l�ments � ajouter.
 */
Array.pushEachElementFromArray = function (arrayToBeFilled, elements) {
    for (var index = 0; index < elements.length; index++) {
        arrayToBeFilled.push(elements[index]);
    }
    return arrayToBeFilled;
};

/**
 * Methode pour cloner proprement un tableau "Array"
 */
Array.prototype.clone = function () {
    return this.slice(0);
};