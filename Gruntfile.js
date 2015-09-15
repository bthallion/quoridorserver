module.exports = function (grunt) {
	grunt.initConfig({
		jshint: {
			files: ['Gruntfile.js', 'src/*.js'],
		},
		concat: {
			options: {
				separator: ';'
			},
			dist: {
				src: ['src/*.js'],
				dest: 'dist/qserver.js'
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.registerTask('default', ['jshint', 'concat']);
};
