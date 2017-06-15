module.exports = {
    target: 'node',
    entry: ['./server/index.js', './node_modules/webpack/hot/poll?1000'],
    output: {
        path: './dist',
        filename: 'server.bundle.js',
        libraryTarget: 'commonjs',
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
    ],
    resolve: {
        extensions: ['', '.js', '.jsx'],
    },
    externals: [/^[a-z]/],
    module: {
        loaders: [
            {
                test: /\.jsx$/,
                loader: 'babel-loader',
                query: {
                    presets: ['react', 'es2015-node6'],
                },
            },
            {
                test: /\.js$/,
                exclude: /mode_modules/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015-node6'],
                },
            },
        ],
    },
    devtool: 'source-map',
};