const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlLoader = require('html-loader');
const pages = require('./pages').pages;

module.exports = {
        mode: 'production',
        entry: '/src/public/scripts/script.ts',
        output: {
                filename: 'bundle.js',
                path: path.resolve(__dirname, '../dist'),
                clean: true,
        },
        resolve: {
                extensions: ['.ts', '.js'],
        },
        module: {
                rules: [
                        {
                                test: /\.html$/,
                                use: [path.resolve(__dirname, 'loaders/html-ads-loader.js'), 'html-loader'],
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
                minimize: true,
                minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
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
                new CopyWebpackPlugin({
                        patterns: [
                                {
                                        from: path.resolve(__dirname, '../src/public/pages/static'),
                                        to: path.resolve(__dirname, '../dist'),
                                },
                        ],
                }),
        ],
};
