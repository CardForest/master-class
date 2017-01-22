module.exports = function(config) {
  config.set({
    browsers: ['Chrome', 'Firefox'],

    frameworks: ['browserify', 'mocha'],

    files: ['test/**/!(transport).js'],
    preprocessors: {
      'test/**/!(transport).js': [ 'browserify' ]
    },

    singleRun: true,
    autoWatch: false
  });
};
