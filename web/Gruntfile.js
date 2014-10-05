module.exports = function(grunt) {

  // Project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['Gruntfile.js', 'js/*.js']
    },
    connect: {
      server: {
        options: {
          port: 9090,
          base: '.',
          keepalive: false,
          livereload: true
        }
      }
    },
    watch: {
      all:{
        options:{
          livereload: true
        },
        files: ['**/*.js', '**/*.html', '**/*.css']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch'); //used to trigger livereload of devserver when files change
  grunt.loadNpmTasks('grunt-contrib-connect'); //used to start server
  
  grunt.registerTask('devServer', ['connect:server', 'watch:all']); //start dev server
};