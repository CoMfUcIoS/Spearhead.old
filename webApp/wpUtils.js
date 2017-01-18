/**
 * Webpack parts
 *
 * @class parts
 * @static
 */
const webpack          = require('webpack'),
    CleanWebpackPlugin = require('clean-webpack-plugin'),
    HtmlWebpackPlugin  = require('html-webpack-plugin'),
    ExtractTextPlugin  = require('extract-text-webpack-plugin'),
    PurifyCSSPlugin    = require('purifycss-webpack-plugin'),
    StyleLintPlugin    = require('stylelint-webpack-plugin'),
    CopyWebpackPlugin  = require('copy-webpack-plugin'),
    debug              = (process.env.NODE_ENV !== 'production');

/**
 * Logs to the console
 *
 * @method  log
 * @public
 * @param {any} The things we want to log to the console
 */
exports.log = function() {
  const args = Array.prototype.slice.call(arguments);
  /*eslint-disable no-console*/
  console.log('============================================================');
  console.log.apply(console, args);
  console.log('============================================================');
  /*eslint-enable no-console*/
};

/**
 * Read command line parameters passed and passes them to the App
 *
 * @method setCmdLineVars
 * @public
 * @return {Object}         Config object for web pack
 */
exports.setCmdLineVars = function() {
  let _config = {};

  process.argv.forEach((keyValue) => {
    let split,
        key;
    // We need to use -- before each key ex. --port=1221
    if (keyValue.indexOf('--') === 0) {
      split = keyValue.split('=');
      if (split.length === 2) {
        key = split[0].substring(2, split[0].length);
        if (typeof _config[key] === 'number') {
          _config[key] = parseInt(split[1], 10);
        } else if (typeof _config[key] === 'boolean') {
          _config[key] = (split[1] === 'true');
        } else {
          _config[key] = JSON.stringify(split[1]);
        }
      }
    }
  });

  return {
    plugins : [
      new webpack.DefinePlugin(Object.assign(process.env, _config))]
  };
};

/**
 * Adds the needed config we need to lint
 * CSS and Javascript with webpack
 *
 * @method  lint
 * @public
 * @param  {String} jsPath  Path of our JS files
 * @param  {String} cssPath Path of our CSS files
 * @return {Object}         Config object for web pack
 */
exports.lint = function(jsPath, cssPath) {
  return {
    module : {
      preLoaders : [
        {
          test    : /\.jsx?$/,
          loaders : ['eslint'],
          include : jsPath
        }
      ]
    },
    plugins : [
      new StyleLintPlugin({
        context     : cssPath,
        files       : '**/*.s?(a|c)ss',
        failOnError : false,
        syntax      : 'scss'
      })
    ]
  };
};

/**
 * Returns the needed configuration for loading
 * ES6 JS files
 *
 * @method  babel
 * @public
 * @return {Object} Config object for web pack
 */
exports.babel = function() {
  return {
    module : {
      loaders : [
        {
          test    : /\.jsx?$/,
          exclude : /node_modules(?!\/(react-slyer|slyer))/,
          loader  : 'babel-loader',
          query   : {
            cacheDirectory : 'babel_cache',
            presets        : (debug) ? ['react', 'es2015', 'react-hmre', 'stage-0'] : ['react', 'es2015'],
            plugins        : [
              'react-html-attrs',
              'transform-class-properties',
              'transform-decorators-legacy'
            ]
          }
        }
      ]
    }
  };
};

/**
 * Returns the needed configuration for creating
 * the index.html file for our builds.
 *
 * @method  createIndex
 * @public
 * @param  {String}  path  Path from the using template
 * @param  {Boolean} build True if its a formal build
 * @return {Object}        Config object for web pack
 */
exports.createIndex = function(path, build) {
  return {
    plugins : [
      new HtmlWebpackPlugin({
        cache       : true,
        title       : 'RepKnight App',
        template    : path + '/index.ejs',
        devServer   : (!build) ? 'https://localhost:8090' : false,
        cssurl      : (!build) ? 'https://localhost:8090' : '.',
        mobile      : true,
        inject      : false,
        appMountIds : ['main'],
        hash        : true,
        showErrors  : true
      })
    ]
  };
};

exports.createIntegrateIndex = function(path, build) {
  return {
    plugins : [
      new HtmlWebpackPlugin({
        cache       : true,
        title       : 'RepKnight App',
        template    : path + '/integrateIndex.ejs',
        devServer   : (!build) ? 'https://localhost:8090' : false,
        mobile      : true,
        inject      : false,
        appMountIds : ['react'],
        hash        : true,
        showErrors  : true
      })
    ]
  };
};

/**
 * Returns the configuration for webpack-dev-server
 *
 * @method  devServer
 * @public
 * @param  {Object} options Contains options we want to pass to dev-server
 * @return {Object}         Config object for web pack
 */
exports.devServer = function(options) {
  return {
    devServer : {
      historyApiFallback : true,
      hot                : true,
      inline             : true,
      contentBase        : 'build',
      stats              : {
        colors       : true,
        hash         : true,
        version      : true,
        timings      : true,
        assets       : true,
        chunks       : false,
        modules      : false,
        reasons      : true,
        children     : false,
        source       : true,
        errors       : true,
        errorDetails : true,
        warnings     : true,
        publicPath   : false
      },
      https        : true,
      host         : options.host, // Defaults to `localhost`
      port         : options.port, // Defaults to 8090,
      watchOptions : {
        aggregateTimeout : 300,
        poll             : 1000
      }
    },
    plugins : [
      new webpack.HotModuleReplacementPlugin({
        multiStep : true
      })
    ]
  };
};

/**
 * Returns the configuration for CSS files
 *
 * @method  setupCSS
 * @public
 * @param  {String} paths Path for css files
 * @return {Object}       Config object for web pack
 */
exports.setupCSS = function(paths) {
  return {
    module : {
      loaders : [
        {
          test    : /\.css$/,
          loaders : ['style', 'css'],
          include : paths
        }
      ]
    }
  };
};

/**
 * Returns the configuration for minification of CSS, HTML and JS
 *
 * @method  minify
 * @public
 * @return {Object} Config object for web pack
 */
exports.minify = function() {
  return {
    module : {
      loaders : [
        {
          test   : /\.html$/,
          loader : 'raw!html-minify'
        }
      ]
    },
    plugins : (debug) ? [] : [
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({
        compress  : { warnings : false },
        output    : { comments : false },
        mangle    : true,
        sourcemap : false,
        beautify  : false,
        dead_code : true
      })
    ]
  };
};

/**
 * Returns the configuration for setting the plugin's
 * environment variables
 *
 * @method  setFreeVariable
 * @public
 * @param {String} key   This is the variable name
 * @param {String} value Value we want to set to the above variable
 * @return {Object}       Config object for web pack
 */
exports.setFreeVariable = function(key, value) {
  const env = {};
  env[key] = JSON.stringify(value);

  return {
    plugins : [
      new webpack.DefinePlugin(env)
    ]
  };
};

exports.extractBundle = function(options) {
  const entry = {};
  entry[options.name] = options.entries;

  return {
    // Define an entry point needed for splitting.
    entry   : entry,
    plugins : [
      // Extract bundle and manifest files. Manifest is
      // needed for reliable caching.
      new webpack.optimize.CommonsChunkPlugin({
        names : [options.name, 'manifest'],

        // options.name modules only
        minChunks : Infinity
      })
    ]
  };
};

/**
 * Deletes a folder from dev environment
 *
 * @method  clean
 * @public
 * @param  {String} path Path of the folder we want to delete
 * @return {Object}      Config object for web pack
 */
exports.clean = function(path) {
  return {
    plugins : [
      new CleanWebpackPlugin([path], {
        // Without `root` CleanWebpackPlugin won't point to our
        // project and will fail to work.
        root : process.cwd()
      })
    ]
  };
};

/**
 * Extracts css to an external file
 *
 * @method  extractCSS
 * @public
 * @param  {String} paths Path of the file you want to extract
 * @return {Object}       Config object for web pack
 */
exports.extractCSS = function() {
  const cssPath = 'build/css/style.[chunkhash].css';

  return {
    module : {
      loaders : [
        // Extract CSS during build
        {
          test   : /\.css$|\.scss$|\.sass$/,
          loader : ExtractTextPlugin.extract('css?sourceMap!postcss!sass')
          // include: paths
        }
      ]
    },
    postcss : function() {
      return [
        require('autoprefixer'),
        require('postcss-google-font')
      ];
    },
    plugins : [
      // Output extracted CSS to a file
      new ExtractTextPlugin(cssPath, {
        allChunks : true
      })
    ]
  };
};

/**
 * Removes unused CSS styles from css file
 *
 * @method  purifyCSS
 * @public
 * @param  {String} paths Path of the files
 * @return {Object}       Config object for webpack
 */
exports.purifyCSS = function(paths) {
  return {
    plugins : [
      new PurifyCSSPlugin({
        basePath : process.cwd(),
        // `paths` is used to point PurifyCSS to files not
        // visible to Webpack. You can pass glob patterns
        // to it.
        paths    : paths
      })
    ]
  };
};

/**
 * Copies the defined folder to the specified
 * location
 *
 * @method  copyStatic
 * @public
 * @param  {String} from File/Folder path you want to copy
 * @param  {String} to   Path of where you want to copy the above file/folder
 * @return {Object}      Config object for web pack
 */
exports.copyStatic = function(from, to) {
  return {
    plugins : [
      new CopyWebpackPlugin([
        {
          from : from,
          to   : to
        }
      ])
    ]
  };
};
