const fs = require('fs');
const mozjpeg = require('imagemin-mozjpeg');

function generateArrCopy(lib, dest, src) {
  var arr = lib;
  var files = [];

  if (src != undefined) {
    files.push({
      expand: true,
      cwd: src,
      src: ['**'],
      dest: dest
    });
  }

  arr.forEach(function (element, index) {
    var path = arr[index];
    var file = "**";

    if (path.indexOf('.') > 0) {
      file = path.slice(path.lastIndexOf('/')).substring(1);
      path = path.slice(0, path.lastIndexOf('/'));
    }

    files.push({
      expand: true,
      cwd: path,
      src: file,
      dest: dest
    });
  });

  return files;
}

module.exports = function (grunt) {
  function generatePath() {
    var obj = grunt.file.readJSON('grunt.config.json');

    //VERIFY IF IS MULTSITE
    obj.isMultisite = typeof obj.server != 'string';

    //SET CORRECT BASE PATH
    obj.site = obj.isMultisite ? (grunt.option('site') || Object.keys(obj.server)[0]) : '';

    //SET CORRECT SERVER URL
    obj.server = obj.isMultisite ? obj.server[obj.site] : obj.server;

    //GENERATE ROOTS
    obj.src.dir = obj.site + (obj.isMultisite ? '/' : '') + obj.src.dir;
    obj.dest.dir = obj.site + (obj.isMultisite ? '/' : '') + obj.dest.dir;

    // GENERATE SOURCE PATHS
    obj.src.scss = obj.src.dir + '/' + obj.src.scss;
    obj.src.scripts = obj.src.dir + '/' + obj.src.scripts;
    obj.src.images = obj.src.dir + '/' + obj.src.images;
    obj.src.fonts = obj.src.dir + '/' + obj.src.fonts;
    obj.src.html = obj.src.dir + '/' + obj.src.html;
    obj.src.vendors = obj.src.dir + '/' + obj.src.vendors;

    //GENERATE DESTINY PATHS
    obj.dest.scss = obj.dest.dir + '/' + obj.dest.scss;
    obj.dest.scripts = obj.dest.dir + '/' + obj.dest.scripts;
    obj.dest.images = obj.dest.dir + '/' + obj.dest.images;
    obj.dest.fonts = obj.dest.dir + '/' + obj.dest.fonts;
    obj.dest.html = obj.dest.dir + '/' + obj.dest.html;
    obj.dest.vendors = obj.dest.dir + '/' + obj.dest.vendors;

    if (!fs.existsSync(obj.src.scss))
      grunt.fail.fatal("Digite uma pasta válida \n");

    return obj;
  };

  var app = generatePath();

  grunt.initConfig({
    app: app,
    banner: app.banner ? '/**\n' +
      '* <%= app.title %>\n' +
      '* Desenvolvido por <%= app.author %>\n' +
      '* <%= app.authorUrl %>\n' +
      '* <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> \n' +
      '**/\n' : '',

    watch: {
      configs: {
        files: ['grunt.config.json', 'Gruntfile.js']
      },

      compass: {
        files: ['<%= app.src.scss %>/**/*.scss'],
        tasks: ['sass:preview']
      },

      html: {
        files: '<%= app.src.html %>/**/*.html',
        tasks: ['includereplace']
      },

      js: {
        files: ['<%= app.src.scripts %>/**/*'],
        tasks: ['clean:scripts', 'copy:scripts', 'babel:preview']
      },

      img: {
        files: ['<%= app.src.images %>/**/*'],
        tasks: ['clean:images', 'imagemin', 'sprite']
      },

      sprite: {
        files: ['<%= app.src.images %>/<%= app.sprite.src %>/**/*'],
        tasks: ['clean:images', 'imagemin', 'sprite']
      },

      fonts: {
        files: ['<%= app.src.fonts %>/**/*.{*}'],
        tasks: ['clean:fonts', 'copy:fonts']
      },

      others: {
        files: ['<%= app.src.vendors %>/**/*.{*}'],
        tasks: ['clean:others', 'copy:others']
      }
    },

    sass: {
      preview: {
        options: {
          sourceMap: true,
          outputStyle: 'expanded',
          sourceComments: true,
          includePaths: '<%= app.libraries.scss %>'
        },
        files: [{
          expand: true,
          cwd: '<%= app.src.scss %>',
          src: ['**/*.scss'],
          dest: '<%= app.dest.scss %>',
          ext: '.css',
          extDot: 'last'
        }]
      },
      dist: {
        options: {
          sourceMap: false,
          outputStyle: 'compressed',
          sourceComments: false,
          includePaths: '<%= app.libraries.scss %>'
        },
        files: [{
          expand: true,
          cwd: '<%= app.src.scss %>',
          src: ['**/*.scss'],
          dest: '<%= app.dest.scss %>',
          ext: '.css',
          extDot: 'last'
        }]
      }
    },

    babel: {
      preview: {
        options: {
          sourceMap: true,
          presets: ['@babel/preset-env']
        },
        files: [{
          expand: true,
          cwd: '<%= app.src.scripts %>',
          src: ['**/*.js'],
          dest: '<%= app.dest.scripts %>',
        }]
      },
      dist: {
        options: {
          minified: true,
          presets: ['@babel/preset-env']
        },
        files: [{
          expand: true,
          cwd: '<%= app.src.scripts %>',
          src: ['**/*.js'],
          dest: '<%= app.dest.scripts %>',
        }]
      }
    },

    copy: {
      fonts: {
        files: generateArrCopy(app.libraries.fonts, app.dest.fonts, app.src.fonts)
      },

      scripts: {
        files: generateArrCopy(app.libraries.scripts, app.dest.scripts)
      },

      others: {
        files: generateArrCopy(app.libraries.vendors, app.dest.vendors, app.src.vendors)
      }
    },

    sprite: {
      default: {
        cssFormat: 'scss',
        algorithm: 'binary-tree',
        padding: 8,
        src: '<%= app.src.images %>/<%= app.sprite.src %>/*.{png,jpg}',
        dest: '<%= app.src.images %>/<%= app.sprite.file %>',
        destCss: '<%= app.src.scss %>/<%= app.sprite.scssDir %>/<%= app.sprite.scssFile %>',
        cssSpritesheetName: 'sprite',
        imgPath: '/Content/img/<%= app.sprite.file %>'
      }
    },

    clean: {
      css: ['<%= app.dest.scss %>/**/*'],
      scripts: ['<%= app.dest.scripts %>/**/*.{js,json}'],
      images: ['<%= app.dest.images %>/**/*.{ico,png,jpg,jpeg}'],
      fonts: ['<%= app.dest.fonts %>/**/*'],
      others: ['<%= app.dest.vendors %>/**/*'],
      all: ['<%= app.dest.scss %>', '<%= app.dest.html %>', '<%= app.dest.scripts %>', '<%= app.dest.images %>', '<%= app.dest.fonts %>', '<%= app.dest.vendors %>'],
      options: {
        force: true
      }
    },

    usebanner: {
      dist: {
        options: {
          position: 'top',
          banner: '<%= banner %>',
          linebreak: false
        },
        files: {
          src: ['<%= app.dest.scss %>/*.css', '<%= app.dest.scripts %>/*.js']
        }
      }
    },

    imagemin: {
      compress: {
        options: {
          optimizationLevel: 3,
          svgoPlugins: [{
            removeViewBox: false
          }],
          use: [mozjpeg()] // Example plugin usage
        },
        files: [{
          expand: true,
          cwd: '<%= app.src.images %>',
          src: ['**/*.{png,jpg,gif}', '!<%= app.sprite.src %>/**'],
          dest: '<%= app.dest.images %>'
        }]
      }
    },

    includereplace: {
      default: {
        files: [{
          expand: true,
          cwd: '<%= app.src.html %>',
          src: ['**/*.html', '!includes/**'],
          dest: '<%= app.dest.html %>'
        }]
      }
    },

    browserSync: {
      default: {
        bsFiles: {
          src: [
            '<%= app.dest.dir %>/**/*'
          ]
        },
        options: (function () {
          var obj = {
            watchTask: true
          };

          if (app.server != '' && app.server != undefined)
            obj.proxy = app.server;
          else
            obj.server = ['./' + app.site, app.dest.html];

          return obj;
        })(),
        proxy: {
          target: "app.server",
          proxyRes: [
            function (proxyRes, req, res) {
              console.log(proxyRes.headers);
            }
          ]
        }
      }
    }
  });

  grunt.event.on('watch', function (action, filepath, target) {
    grunt.log.write(filepath);
    if (filepath.indexOf('grunt.config.json') > -1 || filepath.indexOf('Gruntfile.js') > -1) {
      grunt.fatal('Você alterou o arquivo "' + filepath + '".\nInicie o grunt novamente.');
      process.exit();
    }
  });

  grunt.registerTask('default', ['work']);

  grunt.registerTask('work', [
    'build',
    'browserSync',
    'watch',
  ]);

  grunt.registerTask('build', [
    'clean:all',
    'copy',
    'imagemin',
    'sprite',
    'sass:preview',
    'babel:preview',
    'includereplace'
  ]);

  grunt.registerTask('dist', [
    'clean:all',
    'copy',
    'imagemin',
    'sprite',
    'sass:dist',
    'babel:dist',
    'includereplace',
    'usebanner'
  ]);

  require('load-grunt-tasks')(grunt);
};