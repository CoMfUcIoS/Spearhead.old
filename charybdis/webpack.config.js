
const webpack = require('webpack'),
    path = require('path'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    merge = require('webpack-merge'),
    debug = (process.env.NODE_ENV !== 'production'),
    sass = (debug) ?
    {
      module : {
        loaders : [
          {
            test    : /\.scss$/,
            loaders : ['style-loader', 'css-loader?sourceMap', 'sass-loader?sourceMap']
          }
        ]
      }
    } :
    {
      module : {
        loaders : [
          {
            test   : /\.scss$/,
            loader : ExtractTextPlugin.extract(
              'style', // backup loader when not building .css file
              'css!sass' // loaders to preprocess CSS
          )
          }
        ]
      }
    },

    config = {
      sassLoader : {
        data : '$debug: ' + debug + ';'
      },
      devtool   : debug ? 'sourcemap' : null,
      entry     : path.join(__dirname, 'src', 'app-client.js'),
      devServer : {
        inline             : true,
        port               : 3333,
        contentBase        : 'src/static/',
        historyApiFallback : {
          index : '/index-static.html'
        }
      },
      output : {
        path       : path.join(__dirname, 'src', 'static', 'js'),
        publicPath : '/js/',
        filename   : 'bundle.js'
      },
      module : {
        loaders : [{
          test    : path.join(__dirname, 'src'),
          loader  : ['babel-loader'],
          exclude : ['*.csr'],
          query   : {
            cacheDirectory : 'babel_cache',
            presets        : ['es2015', 'stage-0'],
            plugins        : ['inferno']
          }
        }]
      },
      plugins : debug ? [] : [
        new ExtractTextPlugin('../css/style.css'),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV' : JSON.stringify(process.env.NODE_ENV)
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
          compress  : { warnings : false },
          mangle    : true,
          sourcemap : false,
          beautify  : false,
            dead_code : true //eslint-disable-line
        }),
      ]
    };

module.exports = merge(config, sass);
