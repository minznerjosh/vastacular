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
                tasks: ['test']
            }
        },
        jshint: {
            code: {
                src: CODE
            }
        }
    });

    grunt.registerTask('test', [
        'jasmine:test',
        'jshint:code'
    ]);

    grunt.registerTask('tdd', [
        'test',
        'watch:test'
    ]);
};
