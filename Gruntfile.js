'use strict';

var TESTS = ['test/spec/**/*.ut.js'];
var LIBS = [
    'index.js',
    'lib/**/*.js'
];
var CODE = LIBS.concat(TESTS);

module.exports = function gruntfile(grunt) {
    var pkg = require('./package.json');
    var npmTasks = Object.keys(pkg.devDependencies).filter(function(name) {
        return (name !== 'grunt-cli') && (/^grunt-/).test(name);
    });

    npmTasks.forEach(function(name) {
        grunt.task.loadNpmTasks(name);
    });
    grunt.task.loadTasks('./tasks');

    grunt.initConfig({
        jasmine: {
            test: {
                src: TESTS
            }
        },
        watch: {
            test: {
                files: CODE,
                tasks: ['jasmine:test', 'jshint']
            }
        },
        jshint: {
            options: {
                jshintrc: true
            },
            code: {
                src: CODE
            }
        },
        karma: {
            options: {
                configFile: 'test/karma.conf.js'
            },
            tdd: {
                options: {
                    autoWatch: true
                }
            },
            test: {
                options: {
                    singleRun: true
                }
            }
        }
    });

    grunt.registerTask('test', [
        'jasmine:test',
        'karma:test',
        'jshint:code'
    ]);

    grunt.registerTask('tdd', function(_target_) {
        var target = _target_ || 'node';

        grunt.task.run((function() {
            switch (target) {
            case 'node':
                return 'watch:test';
            case 'browser':
                return 'karma:tdd';
            }
        }()));
    });
};
