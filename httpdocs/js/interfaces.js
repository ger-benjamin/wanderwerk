/**
 * API created by Benjamin Gerber
 * Open source, following the licence "Creative Commons BY-NC"
 * Based on OpenLayers 2.12, GeoExt 1.1, HighCharts 2.3.5, Geonames, GeoAdmin API and
 * Wanderwerk Alpha (created in 2012 by Benjamin Gerber and Nicolas PY as
 * a school-project for COMEM, HEIG-VD).
 */
/**
 * Make Ext panels and set centent
 */
function makePanels () {
    this.makeChart();

    //Arrange and display panels
    new Ext.Viewport({
        layout: 'border',
        rendreTo: Ext.getBody(),
        items: [
            this.makeHeader(),
            this.makeMapPanel(),
            this.makeDataPanel()
        ]
    });
    this.setLinesSelector(true);
}

/**
 * Create and return a "header" wich contain two other panel (for buttons and
 *  general informations)
 * @return (object) Ext.MapPanel 
 */
function makeHeader () {
    var tempHTML = '<div class="lineSelector">\n\
                <p><label for="lineSelector">Tracé : </label></p>\n\
                <p><select id="lineSelector" type="text" name="lineSelector"></select></p>\n\
            </div>'; //@fixme because EXTJS is too bad to create node easily :-(
    return new Ext.Panel({
        region: 'north',
        height: 75,
        cls: 'header-panel',
        items: [
            new Ext.Panel({
                region: 'north',
                height: 25,
                html: '<p>Wanderwerk : Créez votre profil de marche</p>',
                cls: 'info-panel'
            }),
            new Ext.Panel({
                region: 'center',
                height: 50,
                html: '<div class="buttons"></div>' + tempHTML,
                cls: 'toolbar'
            })
        ]
    });
}

/**
 * Create map SwissTopo and put her into the returned panel.
 * @return (object) GeoExt.MapPanel.
 */
function makeMapPanel () {
    var apiST, mapPanel;
    apiST = new GeoAdmin.API({lang: 'fr'});

    this.map = apiST.createMap({
        layers: "ch.swisstopo.pixelkarte-farbe, test",
        easting: 600000,
        northing: 200000
    });

    mapPanel = new GeoExt.MapPanel({
        region: 'center',
        split: false,
        cls: 'map-panel',
        map: this.map,
        zoom: 4
    });

    return mapPanel;
}

/**
 * Create and return data panel whith grid (datatable) for profil's information
 * @return (object) Ext.MapPanel 
 */
function makeDataPanel () {
    var dataPanel,
            panelProperties = new Ext.Panel({
    region: 'north',
            height: 30,
            cls: 'properties-panel',
            html: '<div class="properties">'
            + '<div class="left"><p class="label"><label for="speed">Facteur de vitesse(kme/h) : </label></p><p><input id="speed" class="speed" type="number" name="speed" value="4" /></p></div>'
            + '<div class="right" style="display:none;"><p class="label"><label for="maps">Cartes topographiques : </label></p><p><input id="maps" type="text" name="maps" /></p></div>'
            + '</div>'
    });
    
    this.tabPanel = this.makeGridsTabPanel();

    dataPanel = new Ext.Panel({
        title: 'Informations',
        layout: 'border',
        region: 'south',
        height: 300,
        split: true,
        cls: 'data-panel',
        autoScroll: true,
        items: [
            panelProperties,
            this.tabPanel
        ]
    });

    return dataPanel;
}
/**
 * Create a hidden panel container for futur chart.
 * This panel will not be "created and destroyed" but will be "displayed and
 * hidden" to prevent bugs and improve the process.
 * Create the chart without data.
 */
function makeChart () {
    this.chartPanel = new Ext.Window({
        width: 600,
        height: 450,
        title: "Profil altimetrique",
        html: '<div id="chartcontainer"></div>',
        cls: 'chart-panel',
        closable: true,
        closeAction: 'hide'
    });

    chartPanel.show();
    chartPanel.hide();

    this.chart = new Highcharts.Chart({
        chart: {
            renderTo: 'chartcontainer',
            type: 'line'
        },
        width: '590px',
        height: '355px',
        title: {
            text: 'Profile altimétrique'
        },
        tooltip: {
            formatter: function () {
                return '<b>' + this.key + '</b><br/>' +
                        this.x + 'km à ' + this.y + 'm';
            }
        },
        xAxis: {
            title: {
                text: 'Distance [km]'
            }
        },
        yAxis: {
            title: {
                text: 'Elévation [m]'
            }
        },
        series: null
    });
}

/**
 * Make and return a TabPanel with gridPanel in each two tabs.
 */
function makeGridsTabPanel () {
    return  new Ext.TabPanel({
        height: 200,
        region: 'center',
        cls: 'grids-tabpanel',
        activeTab: 0,
        items: [
            this.makeProfileGridPanel(),
            this.makeCompareGridPanel()
        ]
    });
}

/**
 * Create the gridPanel (datatable) for selected profile and set his format.
 * @return (object) Ext.grid.GridPanel
 */
function makeProfileGridPanel () {
    var colModel, gridPanel, width;
    // Set the data store for the table
    this.profileDs = new Ext.data.ArrayStore({
        fields: [{
                name: 'name'
            }, {
                name: 'alt',
                type: 'int'
            }, {
                name: 'deniv100',
                type: 'float'
            }, {
                name: 'km',
                type: 'float'
            }, {
                name: 'kme',
                type: 'float'
            }, {
                name: 'tmp'
            }, {
                name: 'kmTotal',
                type: 'float'
            }, {
                name: 'kmeTotal',
                type: 'float'
            }, {
                name: 'tmpTot'
            }]
    });
    //Calcul width manually because ExtJS seem not offert this feature.
    width = Math.floor(document.body.offsetWidth / this.profileDs.fields.length);
    // create the colum Manager
    colModel = new Ext.grid.ColumnModel({
        defaults: {
            width: width
        }, columns: [{
                header: 'Nom',
                dataIndex: 'name'
            }, {
                header: 'Altitude [m]',
                dataIndex: 'alt'
            }, {
                header: 'Dénivelé par 100m [m/hm]',
                dataIndex: 'deniv100'
            }, {
                header: 'Distance [km]',
                dataIndex: 'km'
            }, {
                header: 'Km-efforts [km]',
                dataIndex: 'kme'
            }, {
                header: 'Temps [h:m]',
                dataIndex: 'tmp'
            }, {
                header: 'Distance Totale [km]',
                dataIndex: 'kmTotal'
            }, {
                header: 'Km-efforts totaux [km]',
                dataIndex: 'kmeTotal'
            }, {
                header: 'Temps Total [h:m]',
                dataIndex: 'tmpTot'
            }
        ]});
        //Create the GridPanel with the previously created column model.
    gridPanel = new Ext.grid.GridPanel({
        title: 'Tracé actif',
        store: this.profileDs,
        colModel: colModel,
        trackMouseOver: false,
        height: 200,
        region: 'center',
        cls: 'grid-panel',
        viewConfig: {
            emptyText: "Vous devez calculer au moins un profile pour l'afficher."
        }
    });
    return gridPanel;
}

/**
 * Create the gridPanel (datatable) to compare profiles and set his format.
 * @return (object) Ext.grid.GridPanel
 */
function makeCompareGridPanel () {
    var colModel, gridPanel, width;
    //Set the data store for the table
    this.compareDs = new Ext.data.ArrayStore({
        fields: [{
                name: 'name'
            }, {
                name: 'km',
                type: 'float'
            }, {
                name: 'kme',
                type: 'float'
            }, {
                name: 'heightMin',
                type: 'int'
            }, {
                name: 'heightMax',
                type: 'int'
            }, {
                name: 'sumDescend',
                type: 'int'
            }, {
                name: 'sumAscend',
                type: 'int'
            }, {
                name: 'pauses',
                type: 'int'
            }, {
                name: 'tmp'
            }, {
                name: 'tmpWithPauses',
            }]
    });
    //Calcul width manually because ExtJS seem not offert this feature.
    width = Math.floor(document.body.offsetWidth / this.compareDs.fields.length);
    //Create the colum Manager
    colModel = new Ext.grid.ColumnModel({
        defaults: {
            width: width,
            sortable: true
        },
        columns: [{
                header: 'Nom',
                dataIndex: 'name'
            }, {
                header: 'Km totaux [km]',
                dataIndex: 'km'
            }, {
                header: 'Km-efforts totaux [km]',
                dataIndex: 'kme'
            }, {
                header: 'Altitude min [m]',
                dataIndex: 'heightMin'
            }, {
                header: 'Altitude max [m]',
                dataIndex: 'heightMax'
            }, {
                header: 'Descente totale [m]',
                dataIndex: 'sumDescend'
            }, {
                header: 'Montée totale [m]',
                dataIndex: 'sumAscend'
            }, {
                header: 'Nombre de pauses',
                dataIndex: 'pauses'
            }, {
                header: 'Temps sans pause [h:m]',
                dataIndex: 'tmp'
            }, {
                header: 'Temps avec pauses [h:m]',
                dataIndex: 'tmpWithPauses'
            }
        ]});

    //Create the GridPanel with the previously created column model.
    gridPanel = new Ext.grid.GridPanel({
        title: 'Comparatif des tracés',
        store: this.compareDs,
        colModel: colModel,
        trackMouseOver: false,
        height: 200,
        region: 'center',
        cls: 'grid-panel',
        viewConfig: {
            emptyText: "Vous devez calculer au moins un profile afficher une comparaison."
        }
    });
    return gridPanel;
}