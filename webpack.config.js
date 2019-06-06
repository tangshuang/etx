module.exports = {
	mode: 'none',
	entry: __dirname + '/src/etx.js',
	output: {
		path: __dirname + '/dist',
		filename: 'etx.js',
		library: 'etx',
		libraryTarget: 'umd',
		globalObject: `typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this`,
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				use: 'babel-loader',
			},
		],
	},
	optimization: {
		minimize: false,
		usedExports: true,
		sideEffects: true,
	},
	devtool: 'source-map',
}