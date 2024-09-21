const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

class Page {
        name;

        constructor(name) {
                this.name = name;
        }

        Gen() {
                return new HtmlWebpackPlugin({
                        template: path.resolve(__dirname, `../src/public/pages/${this.name}.html`),
                        filename: `${this.name}.html`,
                });
        }
}

const pages = [new Page('index').Gen(), new Page('about').Gen(), new Page('syntax').Gen()];

module.exports = {
        pages,
};
