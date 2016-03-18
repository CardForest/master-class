module.exports = function(config) {
  config.set({
    browsers: ['Chrome', 'Firefox'],

    frameworks: ['browserify', 'mocha'],

    files: ['test/**/*.js'],
    preprocessors: {
      'test/**/*.js': [ 'browserify' ]
    },

    singleRun: true,
    autoWatch: false
  });
};
