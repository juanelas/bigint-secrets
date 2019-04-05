const replace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const minify = require('rollup-plugin-babel-minify');

module.exports = {
    input: './src/main.js',
    format: 'cfs',
    plugins: [
        replace({
            'process.browser': true
        }),
        resolve(),
        commonjs(),
        minify({
            'comments': false
        })
    ],
    output: [
        {
            file: './build/bigint-secrets.browser.min.mod.js',
            format: 'esm'
        }
    ]
};
