var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var path = require('path');
var webpack = require('webpack');

var site = process.argv[2];
console.log("Running for site", site);

var input;
var output;

input = "./docs/react-components/main.js";

var config = {
    devtool: 'eval',
    entry: [
      'webpack-dev-server/client?http://localhost:3001',
      'webpack/hot/only-dev-server',
      input
    ],
    output: {
      path: path.join(__dirname, 'public'),
      filename: 'bundle.js',
      publicPath: '/docs/build/'
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin()
    ],
    module: {
      loaders: [{
        test: /\.js$/,
        loaders: ['react-hot', 'babel', 'jsx?harmony'],
        include: path.join(__dirname, 'react-components')
      }]
    }
};

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true
}).listen(3001, 'localhost', function (err, result) {
  if (err) {
    console.log(err);
  }
  console.log('Running live front end at localhost:3001');
});
