//import { tslint } from 'rollup-plugin-tslint'
import resolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import gzip from 'rollup-plugin-gzip'

const configs = []

for (const pkg of ['core', 'common', 'lit-html', 'ext', 'preact', 'crank']) {
  for (const format of ['umd', 'cjs', 'amd', 'esm']) {
    for (const productive of [false, true]) {
      configs.push(createConfig(pkg, format, productive))
    }
  }
}

export default configs

// --- locals -------------------------------------------------------

function createConfig(pkg, moduleFormat, productive) {
  return {
    input: `src/main/js-elements-${pkg}.ts`,

    output: {
      file: productive
        ? `dist/js-elements.${pkg}.${moduleFormat}.production.js`
        : `dist/js-elements.${pkg}.${moduleFormat}.development.js`,

      format: moduleFormat,
      sourcemap: false, // productive ? false : 'inline', // TODO
      name: 'jsElements.' + pkg,

      globals: {}
    },

    external: ['lit-html', 'preact', 'crank'],

    plugins: [
      resolve(),
      commonjs(),
      // tslint({
      //}),
      replace({
        exclude: 'node_modules/**',
        delimiters: ['', ''],

        values: {
          'process.env.NODE_ENV': productive ? "'production'" : "'development'"
        }
      }),
      typescript({
        exclude: 'node_modules/**'
      }),
      productive && terser(),
      productive && gzip()
    ]
  }
}
