const path = require('path');

module.exports = {
    entry: './src/start.ts',
    mode: process.env.WEBPACK_SERVE ? 'development' : 'production',
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'www', 'build'),
        publicPath: './build/',
        filename: 'game.js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    serve: {
        content: path.resolve(__dirname, "www"),
        devMiddleware: {
            publicPath: '/build/',
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [ 'ts-loader' ],
            },
            {
              test: /\.css$/,
              use: [ 'style-loader', 'css-loader' ]
            },
            {
              test: /\.(png|jpg|gif)$/,
              use: [
                {
                  loader: 'url-loader',
                  options: {
                    limit: 25000
                  },
                },
              ],
            },
        ],
    },
};
