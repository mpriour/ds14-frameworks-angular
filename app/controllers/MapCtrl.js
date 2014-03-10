define([
    'app',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/renderers/ClassBreaksRenderer',
    'dojo/_base/Color'
], function(app, SimpleFillSymbol, SimpleLineSymbol, ClassBreaksRenderer, Color) {

    // define our map controller and register it with our app
    app.controller('MapCtrl', function($scope, $element, $attrs, $http, $filter) {

        angular.extend($scope, {
            statePrices: {},
            layer: null,
            map: null,
            loading: 'loading',
            load: function(evt) {
                var lyr = evt.layer;
                if (lyr) {
                    $scope.layer = lyr;
                    $scope.map = lyr._map;
                    lyr.fields.push({
                        name: 'GAS_DISPLAY',
                        type: 'esriFieldTypeSingle'
                    });
                    lyr.setDrawMode(false);
                    var unlisten = $scope.$on('layer.update-end', function(evt) {
                        unlisten();
                        $http.jsonp('http://apify.heroku.com/api/gasprices.json?callback=JSON_CALLBACK').
                        success(function(data) {
                            if (typeof(data) == 'string') {
                                data = JSON.parse(data);
                            }
                            $scope.loading = '';
                            $scope.drawFeatureLayer(data);
                        }).
                        error($scope.pricesError);
                    });
                }
            },

            drawFeatureLayer: function(data) {
                var lyr = $scope.layer;
                var range = parsePrices(data);
                var breaks = calcBreaks(range[0], range[1], 4);
                breaks.push(range[1].toFixed(2));
                var breakRenderer = createRenderer(breaks);
                lyr.setRenderer(breakRenderer);
                lyr.setDrawMode(true);
                lyr.redraw();
            },

            pricesError: function(e) {
                console.log('error getting gas price data: ', e);
            },


            mouseover: function(evt) {
                var price = evt.graphic && evt.graphic.attributes.GAS_DISPLAY;
                if (price) {
                    $scope.selectedPrice = evt.graphic.attributes.STATE_NAME + ' : ' + $filter('currency')(price);
                }
            },

            mouseout: function(evt) {
                $scope.selectedPrice = evt.graphic && '';
            }
        });

        function parsePrices(gasData) {
            var gmax = -Infinity,
                gmin = Infinity,
                layer = $scope.layer;
            angular.forEach(gasData, function(g) {
                if (["State","Alaska","Hawaii"].indexOf(g.state)<0) {
                    var price = parseFloat(g.regular.replace("$", "")).toFixed(2);
                    $scope.statePrices[g.state] = price;
                    if (price < gmin) {
                        gmin = price;
                    }
                    if (price > gmax) {
                        gmax = price;
                    }
                }
            });
            angular.forEach(layer.graphics, function(fg) {
                fg.attributes.GAS_DISPLAY = $scope.statePrices[fg.attributes.STATE_NAME];
            });
            return [gmin, gmax];
        }

        function createRenderer(breaks){
            var Sfs = SimpleFillSymbol;
            var outline = new SimpleLineSymbol("solid", new Color("#444"), 1);
            var br = new ClassBreaksRenderer(null, 'GAS_DISPLAY');
            br.setMaxInclusive(true);
            br.addBreak(breaks[0], breaks[1], new Sfs("solid", outline, new Color([255, 255, 178, 0.75])));
            br.addBreak(breaks[1], breaks[2], new Sfs("solid", outline, new Color([254, 204, 92, 0.75])));
            br.addBreak(breaks[2], breaks[3], new Sfs("solid", outline, new Color([253, 141, 60, 0.75])));
            br.addBreak(breaks[3], breaks[4], new Sfs("solid", outline, new Color([227, 26, 28, 0.75])));
            return br;
        }

        function calcBreaks(min, max, numberOfClasses) {
            var range = (max - min) / numberOfClasses;
            var breakValues = [];
            for ( var i = 0; i < numberOfClasses; i++ ) {
              breakValues[i] = (min + ( range * i )).toFixed(2);
            }
            return breakValues;
          }
    });
});