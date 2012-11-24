({
    baseUrl: 'scripts',
    name: 'main',
    out: 'main-build.js',
    paths: {
        jquery: 'vendor/jquery-min',
        // The underscore lib is under vendor
        vendorUnderscore: 'vendor/underscore-min',
        // we extend it and alias 'underscore' to our extension
        underscore: 'utils',
        backbone: 'vendor/backbone-min',
        d3: 'vendor/d3.v2',
        text: 'vendor/text',
        highcharts: 'vendor/highcharts'
    }
})
