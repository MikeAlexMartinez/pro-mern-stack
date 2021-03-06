const webpack = require('webpack');

module.exports = {
    entry: {
        app: './src/App.jsx',
        vendor: ['react','react-dom','whatwg-fetch', 'react-router',
            'babel-polyfill', 'react-router-bootstrap',
        ],
    },
    output: {
        path: __dirname + '/static/',
        filename: 'app.bundle.js'
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({ 
            name: 'vendor', filename: 'vendor.bundle.js'
        })
    ],
    devServer: {
        port: 8000,
        contentBase: 'static',
        proxy: {
            '/api/*': {
                target: 'http://localhost:3000'
            }
        },
        historyApiFallback: true,
    },
    devtool: 'source-map',
    module: {
        loaders: [
            {
                test: /\.jsx$/,
                loader: 'babel-loader',
                query: {
                    presets: ['react','es2015']
                }
            }
        ]
    }
}