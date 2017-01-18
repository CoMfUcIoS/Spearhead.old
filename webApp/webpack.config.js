const debug    = (process.env.NODE_ENV !== 'production'),
    webpack    = require('webpack'),
    validate   = require('webpack-validator'),
    merge      = require('webpack-merge'),
    path       = require('path'),
    srcFolder  = path.join(__dirname, 'src'),
    PATHS      = {
      /*eslint-disable key-spacing*/
      jsFolder  : srcFolder,
      app       : path.join(srcFolder, 'app-client.js'),
      cssFolder : path.join(srcFolder, 'scss'),
      style     : path.join(srcFolder, 'scss/app.scss'),
      build     : path.join(__dirname, 'build/')
      /*eslint-enable key-spacing*/
    },
    common = {
      devtool   : (debug) ? 'inline-sourcemap' : false,
      entry     : PATHS.app,
      devServer : {
        inline             : true,
        port               : 8090,
        contentBase        : 'build/',
        historyApiFallback : {
          index : '/index-static.html'
        }
      },
      module : {
        loaders : [
          {
          //fonts
            test   : /\.(eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
            loader : 'url'
          },
          {
          // images
            test   : /\.(ico|jpe?g|png|gif)$/,
            loader : 'file-loader?name=/assets/img/[name].[ext]'          },
          {
          // ejs template system
          // (using ejs for its include method for our bundler)
            test    : /\.ejs$/,
            loaders : ['ejs-compiled-loader?variable=data']
          },
          {
          //data
            test   : /\.json$/,
            loader : 'json'
          }]
      }
    },
    wpUtil = require('./wpUtils'),
    runCmd = process.env.npm_lifecycle_event.replace('webApp-', '');


let config;

// Detect how npm is run and branch based on that
switch (runCmd) {
  case 'build':
    // npm run build
    _makeBuild();
    break;
  case 'dev':
    // npm run start
    _makeStart();
    break;
  default :
    // default will be npm run build
    _makeBuild();
    break;
}

/*!
 * Builds the App whenever we use
 * npm run build
 *
 * @method _makeBuild
 * @private
 */
function _makeBuild() {
  wpUtil.log('============ CREATING A STANDALONE RELEASE BUILD ===========');
  config = merge(
    common,
    {
      output : {
        path          : path.join(PATHS.build, 'js'),
        filename      : '[name].[chunkhash].js',
        // This is used for require.ensure. The setup
        // will work without but this is useful to set.
        chunkFilename : '[chunkhash].js'
      }
    },
    // Set environment variable to production
    wpUtil.setFreeVariable(
      'process.env.NODE_ENV',
      'production'
    ),
    wpUtil.setCmdLineVars(),


    // Compile jsx
    wpUtil.babel(),
    // Delete Build folder
    wpUtil.clean(PATHS.build),

    // Create index.html
    wpUtil.createIndex(PATHS.jsFolder, true),

    // Copy folder with all static files in build folder
    wpUtil.copyStatic(path.join(PATHS.jsFolder, 'img'), path.join(PATHS.build, 'img')),
    // Minify CSS and html
    wpUtil.minify(),
    // Remove unused CSS
    wpUtil.purifyCSS([PATHS.cssFolder]),
    // Save CSS in an external file
    wpUtil.extractCSS(PATHS.cssFolder)
    );
}


module.exports = validate(config);
