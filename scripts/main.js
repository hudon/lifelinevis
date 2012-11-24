// Require.js allows us to configure shortcut alias
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
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        'd3': {
            exports: 'd3'
        }
    },
    paths: {
        jquery: 'vendor/jquery',
        vendorUnderscore: 'vendor/underscore',
        underscore: '/scripts/utils',
        backbone: 'vendor/backbone',
        d3: 'vendor/d3.v2',
        text: 'vendor/text'
    }
});

require([
    'app'
], function (AppView) {
    new AppView();
});

