const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlLoader = require('html-loader');
const pages = require('./pages').pages;

module.exports = {
        mode: 'development',
        entry: '/src/public/scripts/script.ts',
        watchOptions: {
                ignored: /node_modules/,
        },
        cache: {
                type: 'filesystem',
        },
        resolve: {
                extensions: ['.ts', '.js'],
        },
        module: {
                rules: [
                        {
                                test: /\.html$/,
                                use: ['html-loader'],
                        },
                        {
                                test: /\.ts$/,
                                use: 'ts-loader',
                                exclude: /node_modules/,
                        },
                        {
                                test: /\.css$/,
                                use: [MiniCssExtractPlugin.loader, 'css-loader'],
                        },
                ],
        },
        optimization: {
                minimize: false,
                minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
        },
        devtool: 'source-map',
        devServer: {
                static: {
                        directory: path.resolve(__dirname, 'dist/development'),
                },
                compress: false,
                port: 9000,
                hot: true,
                open: true,
        },
        plugins: [
                ...pages,
                new MiniCssExtractPlugin({
                        filename: 'styles.css',
                }),
                new CopyWebpackPlugin({
                        patterns: [
                                {
                                        from: path.resolve(__dirname, '../src/public/assets'),
                                        to: path.resolve(__dirname, '../dist/assets'),
                                },
                        ],
                }),
        ],
};
