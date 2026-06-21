import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import { viteExternalsPlugin } from 'vite-plugin-externals'

export default ({ mode }) => {
  process.env = Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return defineConfig({
    plugins: [
      vue(),
      Icons({ scale: 1, compiler: 'vue3' }),
      mode !== 'test' ? viteExternalsPlugin({ vue: '__VUE_SHARED__', pinia: '__PINIA_SHARED__' }) : null
    ],
    test: {
      globals: true,
      reporters: 'basic',
      environment: 'jsdom'
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    build: {
      lib: {
        entry: path.resolve(__dirname, 'main.js'),
        name: 'index',
        fileName: 'index'
      }
    },
    resolve: {
      dedupe: ['vue'],
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
      alias: {
        '@': path.resolve(__dirname),
        '~tests': path.resolve(__dirname, 'tests')
      }
    }
  })
}
