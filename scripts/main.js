require.config({
    // The shim config allows us to configure dependencies for
    // scripts that do not call define() to register a module
    shim: {
        'vendorUnderscore': {
            exports: '_'
        },
        'jquery': {
            exports: '$'
        },
        'backbone': {
            deps: [ 'vendorUnderscore', 'jquery' ],
            exports: 'Backbone'
        },
        'd3': {
            exports: 'd3'
        },
        'highcharts': {
            deps: ['jquery'],
            exports: 'Highcharts'
        }
    },
    paths: {
        jquery: '/scripts/vendor/jquery-min',
        // The underscore lib is under vendor
        vendorUnderscore: '/scripts/vendor/underscore-min',
        // we extend it and alias 'underscore' to our extension
        underscore: '/scripts/utils',
        backbone: '/scripts/vendor/backbone-min',
        d3: '/scripts/vendor/d3.v2',
        text: '/scripts/vendor/text',
        highcharts: '/scripts/vendor/highcharts'
    }
});

require([
    'app'
], function (AppView) {
    new AppView();
});

