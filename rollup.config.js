import path from 'path'
import typescript from 'rollup-plugin-typescript2'
import chalk from 'chalk'



const version = require('./package.json').version
const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)
const name = path.basename(packageDir)
const resolve = f => path.resolve(packageDir, f)
const pkg = require(resolve(`package.json`))
const packageOptions = pkg.buildOptions || {}

const OUTPUT_CJS = 'cjs';
const OUTPUT_IIFE = 'iife';
const OUTPUT_ES = 'es';
const OUTPUT_UMD = 'umd';
const entryFile = './src/Main.ts'

const outputConfigs = {
  [OUTPUT_UMD]: {
    file: resolve(`dist/${name}.umd.js`),
    format: OUTPUT_UMD
  },
  [OUTPUT_ES]: {
    file: resolve(`dist/${name}.es.js`),
    format: OUTPUT_ES
  },
  [OUTPUT_IIFE]: {
    file: resolve(`dist/${name}.global.js`),
    format: OUTPUT_IIFE
  },
  [OUTPUT_CJS]: {
    file: resolve(`dist/${name}.cjs.js`),
    format: OUTPUT_CJS,
  }
}


const defaultFormats = [OUTPUT_CJS, OUTPUT_IIFE]
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(',')
const packageFormats = inlineFormats || packageOptions.formats || defaultFormats
const packageConfigs = process.env.PROD_ONLY
  ? []
  : packageFormats.map( format => createConfig(format, outputConfigs[format]))


if (process.env.NODE_ENV === 'production') {
  packageFormats.forEach(format => {
    if (format === 'cjs' && packageOptions.prod !== false) {
      packageConfigs.push(createProductionConfig(format))
    }
    if (['esm', 'iife'].includes(format)) {
      packageConfigs.push(createMinifiedConfig(format))
    }
  })
}

export default packageConfigs


function createConfig(format, output, plugins = []) {

  if (!output) {
    console.log(chalk.yellow(`invalid format: "${format}"`))
    process.exit(1)
  }
  output.sourcemap = !!process.env.SOURCE_MAP
  output.name = name

  const tsProject = typescript({
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    tsconfigOverride: {
      compilerOptions: {
        sourceMap: output.sourcemap,
      }
    }
  })
  return {
    input: resolve(entryFile),
    plugins: [
      tsProject,
      ...plugins
    ],
    output
  }
}


function createProductionConfig(format) {
  return createConfig(format, {
    file: resolve(`dist/${name}.${format}.prod.js`),
    format: outputConfigs[format].format
  })
}

function createMinifiedConfig(format) {
  const { terser } = require('rollup-plugin-terser')
  return createConfig(
    format,
    {
      file: outputConfigs[format].file.replace(/\.js$/, '.prod.js'),
      format: outputConfigs[format].format
    },
    [
      terser({
        module: /^esm/.test(format),
        compress: {
          ecma: 2015,
          pure_getters: true
        }
      })
    ]
  )
}
