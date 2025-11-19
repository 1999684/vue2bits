const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production'
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'vue2bits.min.js' : 'vue2bits.js',
      library: 'Vue2bits',
      libraryTarget: 'umd',
      globalObject: 'typeof self !== \'undefined\' ? self : this'
    },
    externals: {
      vue: {
        commonjs: 'vue',
        commonjs2: 'vue',
        amd: 'vue',
        root: 'Vue'
      },
      gsap: {
        commonjs: 'gsap',
        commonjs2: 'gsap',
        amd: 'gsap',
        root: 'gsap'
      }
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'vue-style-loader',
            'css-loader'
          ]
        }
      ]
    },
    plugins: [
      new VueLoaderPlugin(),
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'vue2bits.css'
        })
      ] : [])
    ],
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'src/preview')
        },
        {
          directory: path.join(__dirname, 'src/libs'),
          publicPath: '/libs'
        },
        {
          directory: path.join(__dirname, 'dist'),
          publicPath: '/dist'
        }
      ],
      compress: true,
      port: 9002,
      historyApiFallback: true
    }
  }
}