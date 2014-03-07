/**
 * API created by Benjamin Gerber
 * Open source, following the licence "Creative Commons BY-NC"
 * Based on OpenLayers 2.12, GeoExt 1.1, HighCharts 2.3.5, Geonames, GeoAdmin API
 * jquery and a prototype of Wanderwerk (created in 2012 by Benjamin Gerber and Nicolas PY as
 * a school-project for COMEM, HEIG-VD).
 */
/**
 * Make Ext panels and set centent
 */
function makePanels() {
    this.makeChart();

    var header = this.makeHeader(),
            mapPanel = this.makeMapPanel(),
            dataPanel = this.makeDataPanel();

    //Arrange and display panels
    Ext.create('Ext.container.Viewport', {
        layout: 'border',
        items: [
            header,
            mapPanel,
            dataPanel
        ]
    });
    this.setLinesSelector(true);
}

/**
 * Create and return a "header" wich contain two other panel (for buttons and
 *  general informations)
 * @return (object) Ext.MapPanel 
 */
function makeHeader() {
    var tempHTML = '<div class="lineSelector">\n\
                <p><label for="lineSelector">Tracé : </label></p>\n\
                <p><select id="lineSelector" style="background-color:#000000" type="text" name="lineSelector"></select></p>\n\
            </div>'; //@fixme because EXTJS is too bad to create node easily :-(
    return Ext.create('Ext.panel.Panel', {
        region: 'north',
        xtype: 'panel',
        id: 'ww_header-panel',
        items: [
            Ext.create('Ext.panel.Panel', {
                region: 'north',
                xtype: 'panel',
                height: 25,
                html: '<p>Wanderwerk : Créez votre profil de marche</p>',
                id: 'ww_info-panel'
            }),
            Ext.create('Ext.panel.Panel', {
                region: 'center',
                xtype: 'panel',
                height: 45,
                html: '<div class="buttons"></div>' + tempHTML,
                id: 'ww_toolbar'
            })
        ]
    });
}

/**
 * Create map SwissTopo and put her into the returned panel.
 * @return (object) GeoExt.MapPanel.
 */
function makeMapPanel() {
    return Ext.create('Ext.panel.Panel', {
        region: 'center',
        xtype: 'panel',
        id: 'ww_map-panel'
    });
}

/**
 * Create and return data panel whith grid (datatable) for profil's information
 * @return (object) Ext.MapPanel 
 */
function makeDataPanel() {
    var dataPanel, footer = this.makeFooter(),
            panelProperties = Ext.create('Ext.panel.Panel', {
        region: 'north',
        xtype: 'panel',
        height: 32,
        id: 'ww_properties-panel',
        html: '<div class="properties">'
                + '<div class="left"><p class="label"><label for="speed">Facteur de vitesse(kme/h) : </label></p><p><input id="speed" class="speed" type="number" name="speed" value="4" /></p></div>'
                + '<div class="right" style="display:none;"><p class="label"><label for="maps">Cartes topographiques : </label></p><p><input id="maps" type="text" name="maps" /></p></div>'
                + '</div>'
    });

    this.tabPanel = this.makeGridsTabPanel();



    dataPanel = Ext.create('Ext.panel.Panel', {
        layout: 'border',
        xtype: 'panel',
        region: 'south',
        height: 400,
        split: true,
        id: 'ww_datas-panel',
        items: [
            panelProperties,
            this.tabPanel,
            footer
        ]
    });

    return dataPanel;
}

/**
 * Make and return a TabPanel with gridPanel in each two tabs.
 */
function makeGridsTabPanel() {
    var gridPanel = Ext.create('Ext.tab.Panel', {
        id: 'ww_grids-tabpanel',
        autoScrol: 'auto',
        layout: 'fit',
        activeTab: 0,
        items: [
            this.makeProfileGridPanel(),
            this.makeCompareGridPanel()
        ]
    });
    return Ext.create('Ext.panel.Panel', {
        layout: 'fit',
        region: 'center',
        items: [
            gridPanel
        ]
    })
}

/**
 * Create the gridPanel (datatable) for selected profile and set his format.
 * @return (object) Ext.grid.GridPanel
 */
function makeProfileGridPanel() {
    var colModel, gridPanel;
    // Set the data store for the table
    this.profileDs = Ext.create('Ext.data.Store', {
        storeId: 'profileStore',
        fields: [{
                name: 'name'
            }, {
                name: 'alt'
            }, {
                name: 'deniv100'
            }, {
                name: 'km'
            }, {
                name: 'kme'
            }, {
                name: 'tmp'
            }, {
                name: 'kmTotal'
            }, {
                name: 'kmeTotal'
            }, {
                name: 'tmpTot'
            }]
    });
    // create the colum Model
    colModel = [{
            header: 'Nom',
            dataIndex: 'name'
        }, {
            header: 'Altitude [m]',
            dataIndex: 'alt'
        }, {
            header: 'Dénivelé [m]',
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
    ];
    //Create the GridPanel with the previously created column model.
    gridPanel = Ext.create('Ext.grid.Panel', {
        title: 'Tracé actif',
        store: Ext.data.StoreManager.lookup('profileStore'),
        columns: colModel,
        cls: 'ww_grid-panel',
        id: 'ww_profile-grid-panel',
        forceFit: true,
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
function makeCompareGridPanel() {
    var colModel, gridPanel, width;
    //Set the data store for the table
    this.compareDs = Ext.create('Ext.data.Store', {
        storeId: 'compareStore',
        fields: [{
                name: 'name'
            }, {
                name: 'km'
            }, {
                name: 'kme'
            }, {
                name: 'heightMin'
            }, {
                name: 'heightMax'
            }, {
                name: 'sumDescend'
            }, {
                name: 'sumAscend'
            }, {
                name: 'pauses'
            }, {
                name: 'tmp'
            }, {
                name: 'tmpWithPauses'
            }]
    });
    //Calcul width manually because ExtJS seem not offert this feature.
    width = Math.floor((document.body.offsetWidth - 21) / (this.compareDs.data.length - 2));
    //Create the colum Model
    colModel = [{
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
        }, /* {
         header: 'Nombre de pauses',
         dataIndex: 'pauses'
         }, */ {
            header: 'Temps [h:m]',
            dataIndex: 'tmp'
        }/*, {
         header: 'Temps avec pauses [h:m]',
         dataIndex: 'tmpWithPauses'
         }*/
    ];

    //Create the GridPanel with the previously created column model.
    gridPanel = Ext.create('Ext.grid.Panel', {
        title: 'Comparatif des tracés',
        store: Ext.data.StoreManager.lookup('compareStore'),
        columns: colModel,
        cls: 'ww_grid-panel',
        id: 'ww_compare-grid-panel',
        forceFit: true,
        defaults: {
            sortable: true
        },
        viewConfig: {
            emptyText: "Vous devez calculer au moins un profile afficher une comparaison."
        }
    });
    return gridPanel;
}

/**
 * Make a footer panel
 * @returns (object) Ext.MapPanel 
 */
function makeFooter() {
    return Ext.create('Ext.panel.Panel', {
        region: 'south',
        xtype: 'panel',
        height: 25,
        id: 'ww_footer-panel',
        html: '<div class="footer">'
                + '<p>Wanderwerk V1.02. Edité le 21.10.13. Créé par <a href="http://ch.linkedin.com/in/benjamingerber" target="_blank" title="Voir le profil LinkedIn" >Benjamin Gerber</a>, supporté par les <a href="http://www.scout-perceval.ch/" target="_blank" title="Voir le site des Scouts Perceval de Moutier">Scouts Perceval de Moutier</a>. Application open source, disponible sur <a href="https://github.com/ger-benjamin/wanderwerk" target="_blank" title="Voir le code source">github</a>. Sous licence <a href="http://creativecommons.org/licenses/by-nc/2.5/ch/deed.fr" target="_blank" title="Voir la licence" >Creative Commons BY-NC</a></p>'
                + '</div>'
    });
}

/**
 * Create a hidden panel container for futur chart.
 * This panel will not be "created and destroyed" but will be "displayed and
 * hidden" to prevent bugs and improve the process.
 * Create the chart without data.
 */
function makeChart() {
    this.chartPanel = Ext.create('Ext.window.Window', {
        width: 600,
        height: 450,
        title: "Profil altimetrique",
        html: '<div id="chartcontainer"></div>',
        id: 'ww_chart-panel',
        closable: true,
        closeAction: 'hide'
    });

    this.chartPanel.show();
    this.chartPanel.hide();

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
            formatter: function() {
                return '<b>' + this.key + '</b><br/>' +
                        this.x + 'km à ' + this.y + 'm';
            }
        },
        xAxis: {
            title: {
                text: 'Distance [km]'
            },
            plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
        },
        yAxis: {
            title: {
                text: 'Elévation [m]'
            },
            plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }],
            series: null
        }
    });
}