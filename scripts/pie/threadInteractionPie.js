/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'highcharts'
], function ($, _, Backbone, Highcharts) {

    'use strict';

    function drawFunc(domElement) {
        var chart;

        // Radialize the colors
        Highcharts.getOptions().colors =
            $.map(Highcharts.getOptions().colors, function(color) {
                return {
                    radialGradient: { cx: 0.5, cy: 0.3, r: 0.7 },
                    stops: [
                        [0, color],
                        [1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
                    ]
                };
            }
        );

        // Build the chart
        chart = new Highcharts.Chart({
            chart: {
                renderTo: domElement,
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            title: {
                text: ''
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage}%</b>',
                percentageDecimals: 1
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        color: '#000000',
                        connectorColor: '#000000',
                        formatter: function() {
                            return '<b>'+ this.point.name +'</b>: '+
                                this.percentage.toFixed(2) +' %';
                        }
                    }
                }
            },
            series: [{
                type: 'pie',
                name: 'Thread',
                data: [
                    ['io-pkt-v4-hc tid:1', 1.0],
                    ['io-pkt-v4-hc tid:2', 2.0],
                    {
                        name: 'pipe tid: 2',
                        y: 14.0,
                        sliced: true,
                        selected: true
                    },
                    ['pipe tid: 3', 9.0],
                    ['firefox-bin tid: 0', 19.0],
                    ['firefox-bin tid: 1', 4.0],
                    ['firefox-bin tid: 2', 6.0]
                ]
            }]
        });
    }

    return {
        draw: drawFunc
    };

});
