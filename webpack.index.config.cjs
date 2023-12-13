const path = require("path");

module.exports = {
  entry: "./dist/mjs/index.js",
  devtool: false,
  mode: "production",

  module: {
    noParse: [/gun\.js$/, /sea\.js$/],
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        options: {
          ignore: ["src/**/*.test.ts"],
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      crypto: false ,
      stream: false ,
      path: false ,
      fs: false
    },
  },
  performance: {
    hints: false,
  },
  output: {
    path: path.resolve(__dirname, "./dist/bundle"),
    // The filename needs to match the index.web.d.ts declarations file.
    filename: "index.js",
    library: {
      name: 's5plusLib',
      type: 'umd',
    },
  },
};
