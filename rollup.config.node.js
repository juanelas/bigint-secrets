const replace = require('rollup-plugin-replace');

module.exports = {
    input: './src/main.js',
    format: 'cjs',
    plugins: [
        replace({
            'process.browser': false
        })
    ],
    output: {
        file: './build/bigint-secrets.node.js',
        format: 'cjs'
    }
};
