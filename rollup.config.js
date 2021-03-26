import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import gzip from 'rollup-plugin-gzip'
import brotli from 'rollup-plugin-brotli'

const configs = []

for (const pkg of ['root', 'hooks', 'utils', 'lit']) {
  for (const format of ['esm', 'umd', 'cjs']) {
    for (const productive of [false, true]) {
      configs.push(createConfig(pkg, format, productive))
    }
  }
}

export default configs

// --- locals -------------------------------------------------------

function createConfig(pkg, moduleFormat, productive) {
  const env = productive ? 'production' : 'development'

  return {
    input:
      pkg === 'root'
        ? 'src/main/js-element.ts'
        : `src/main/js-element-${pkg}.ts`,

    output: {
      file:
        pkg === 'root'
          ? `dist/js-element.${moduleFormat}.${env}.js`
          : `dist/js-element-${pkg}.${moduleFormat}.${env}.js`,

      format: moduleFormat,
      sourcemap: false, // productive ? false : 'inline', // TODO
      name: pkg === 'root' ? 'jsElement' : 'jsElement.' + pkg,

      globals: {
        'js-element': 'jsElement',
        ...(pkg === 'lit' && { 'lit-html': 'litHtml' }) // TODO!!
      }
    },

    external: pkg !== 'lit' ? ['js-element'] : ['js-element', 'lit-html'],

    plugins: [
      resolve(),
      commonjs(),
      replace({
        exclude: 'node_modules/**',
        delimiters: ['', ''],
        preventAssignment: false,

        values: {
          'process.env.NODE_ENV': productive ? "'production'" : "'development'"
        }
      }),
      typescript({
        tsconfig: './tsconfig.dist.json'
      }),

      productive && terser(),
      productive && gzip(),
      productive && brotli()
    ]
  }
}
