// Require.js allows us to configure shortcut alias
require.config({
    // The shim config allows us to configure dependencies for
    // scripts that do not call define() to register a module
    shim: {
        'underscore': {
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
        }
    },
    paths: {
        jquery: 'vendor/jquery-min',
        underscore: 'vendor/underscore-min',
        backbone: 'vendor/backbone-min',
        text: 'vendor/text'
    }
});

require([
    'app'
], function (AppView) {

    new AppView();
});

