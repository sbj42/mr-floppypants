const path = require('path');

module.exports = () => {
    return {
        entry: './src/start.ts',
        devtool: 'inline-source-map',
        output: {
            path: path.resolve(__dirname, 'www', 'build'),
            filename: 'game.js',
        },
        resolve: {
            extensions: ['.ts', '.js'],
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
};
