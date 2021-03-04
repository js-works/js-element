import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import gzip from 'rollup-plugin-gzip'

const configs = []

for (const pkg of ['root', 'hooks', 'utils']) {
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
        ? 'src/main/js-elements.ts'
        : `src/main/js-elements-${pkg}.ts`,

    output: {
      file:
        pkg === 'root'
          ? `dist/js-elements.${moduleFormat}.${env}.js`
          : `dist/js-elements-${pkg}.${moduleFormat}.${env}.js`,

      format: moduleFormat,
      sourcemap: false, // productive ? false : 'inline', // TODO
      name: pkg === 'root' ? 'jsElements' : 'jsElements.' + pkg
    },

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
      productive && gzip()
    ]
  }
}
