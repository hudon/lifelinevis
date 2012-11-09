/*jslint nomen: true, browser: true, devel: true*/
/*global _,d3*/
'use strict';
var StackedThreads = (function () {
    function drawFunc() {
        var chart = new Highcharts.Chart({
            chart: {
                renderTo: 'stackedThreads',
                type: 'column'
            },
            title: {
                text: 'Stacked column chart'
            },
            xAxis: {
                categories: [
                    "pid: 925735, tid: 0",
                    "pid: 925735, tid: 2",
                    "pid: 20489, tid: 1",
                    "pid: 20489, tid: 3"
                ]
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Total Interactions'
                },
                stackLabels: {
                    enabled: true,
                    style: {
                        fontWeight: 'bold',
                        color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                    }
                }
            },
            legend: {
                align: 'right',
                x: -100,
                verticalAlign: 'top',
                y: 20,
                floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColorSolid) || 'white',
                borderColor: '#CCC',
                borderWidth: 1,
                shadow: false
            },
            tooltip: {
                formatter: function() {
                    return '<b>'+ this.x +'</b><br/>'+
                        this.series.name +': '+ this.y +'<br/>'+
                        'Total: '+ this.point.stackTotal;
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    dataLabels: {
                        enabled: true,
                        color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
                    }
                }
            },
            series: [{
                name: 'tag0',
                data: [4, 6, 3, 0],
                stack: 'send'
            }, {
                name: 'tag1',
                data: [2, 4, 5, 1],
                stack: 'send'
            },{
                name: 'tag0',
                data: [1, 2, 5, 4],
                stack: 'receive'
            },{
                name: 'tag1',
                data: [3, 8, 2, 1],
                stack: 'receive'
            }]
        });
    }
    return {
        draw: drawFunc
    };
}());
