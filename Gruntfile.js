module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-ts')
  grunt.loadNpmTasks('grunt-text-replace')
  grunt.loadNpmTasks('grunt-contrib-watch')

  grunt.initConfig({
    ts: {
      node: {
        src: "source/export.ts",        // The source typescript files, http://gruntjs.com/configuring-tasks#files
        out: 'metahub-browser.js',                // If specified, generate an out.js file which is the merged js file
        options: {
          target: 'es5',
          module: 'commonjs',
          declaration: false,       // true | false  (default)
          verbose: true
        }
      }
    },
    ts: {
      metahub: {
        src: "source/export.ts",        // The source typescript files, http://gruntjs.com/configuring-tasks#files
        out: 'metahub-node.js',                // If specified, generate an out.js file which is the merged js file
        options: {
          target: 'es5',
          module: 'commonjs',
          declaration: true,       // true | false  (default)
          verbose: true,
          comments: true
        }
      }
    },
    replace: {
      def: {
        src: ["metahub.d.ts"],
        overwrite: true,
        replacements: [
          {
            from: 'export = MetaHub;',
            to: 'declare module "vineyard-metahub" { export = MetaHub }'
          }
        ]
      },
      commonjs: {
        src: "metahub-node.js",
        overwrite: true,
        replacements: [
          {
            from: '///***',
            to: ''
          }
        ]
      }
    },
    watch: {
       metahub: {
        files: 'source/**/*.ts',
        tasks: ['default']
      }
    }
  })

  grunt.registerTask('default', ['ts', 'replace']);

}