const dotenv = require("dotenv");
dotenv.config();

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: "./src/browser-index", // bundle"s entry point
    output: {
        path: path.resolve(__dirname, "dist"), // output directory
        filename: "[name].js", // name of the generated bundle
    },
    resolve: {
        extensions: [".js", ".ts", ".json"],
    },

    mode: "development",

    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "ts-loader",
                exclude: /node_modules/,
            },

            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html",
            inject: "body",
        }),
    ],

    watch: true,

    devServer: {
        historyApiFallback: true,
        contentBase: './',
        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000
        }
    }
};

