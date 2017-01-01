#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const urllib = require('url');

const browserSync = require('browser-sync').create();
const deepExtend = require('deep-extend');
const minimist = require('minimist');

let log = () => {};
let debug = () => {};
// log = debug = console.log.bind(console);

const FILES_TO_WATCH = [
  '*.html',
  '*.css',
  '*.jpg',
  '*.png',
  '*.svg'
];
const ROOT_DIR = '.';
const WATCH_OPTIONS = {};

let smartJSON2POJO = function (obj) {
  try {
    obj = JSON.parse(obj);
  } catch (e) {
    return {};
  }

  // Coerce strings of boolean values to actual booleans.
  obj = JSON.stringify(obj, function (key, val) {
    if (typeof val === 'string') {
      if (val === 'true') {
        return true;
      }
      if (val === 'false') {
        return false;
      }
    }
    return val;
  });

  return JSON.parse(obj);
};

let getConfigFromPackage = (rootDir) => {
  let pkgPath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return {};
  }

  let pkgContents = fs.readFileSync(pkgPath);
  let pkgObj = smartJSON2POJO(pkgContents);

  let pkgConfig = {};
  if ('browser-sync' in pkgObj) {
    pkgConfig = pkgObj['browser-sync'];
  } else if ('bs' in pkgObj) {
    if ('browser-sync' in pkgObj.bs) {
      pkgConfig = pkgObj.bs['browser-sync'];
    } else {
      pkgConfig = pkgObj.bs;
    }
  }

  return pkgConfig;
};

class BSCli {
  constructor() {
    this.rootDir = ROOT_DIR;
    this.watchFiles = FILES_TO_WATCH;
    this.watchOptions = WATCH_OPTIONS;
  }

  run() {
    const argv = minimist(process.argv.slice(2), {
      boolean: ['verbose'],
      string: ['root', 'watch'],
      alias: {
        r: 'root',
        v: 'verbose',
        w: 'watch',
        c: 'config'
      },
    });
    if (argv.root) this.rootDir = argv.root;
    if (argv.verbose) log = console.log.bind(console);
    if (argv.watch) this.watchFiles = argv.watch.split(',');
    if (argv.config) this.configPath = argv.config;

    this.startPath = argv._[0] ? path.resolve(argv._[0]) : '';
    if (this.startPath) {
      this.rootDir = path.resolve(path.dirname(this.startPath), this.rootDir);
    } else {
      this.rootDir = process.cwd();
    }
    this.startUrl = this.toUrl(this.startPath);
    let startPathComponents = path.parse(this.startPath);
    this.watchFiles = this.watchFiles.map(f => path.resolve(startPathComponents.dir, f));
    this.configPath = this.configPath || path.join(this.rootDir, 'bs-config.js');

    let config = {};
    const defaultConfig = {
      files: [
        {
          match: this.watchFiles
        }
      ],
      server: {
        baseDir: this.rootDir,
        directory: true,
        middleware: [
          new Preview(this.rootDir).createMiddleware()
        ]
      },
      startPath: this.startUrl
    };
    const pkgConfig = getConfigFromPackage(this.rootDir);
    let localConfig = {};
    if (this.configPath) {
      try {
        localConfig = require(this.configPath);
      } catch (e) {
      }
    }

    deepExtend(config, defaultConfig, pkgConfig, localConfig);

    browserSync.init(config);
  }

  toUrl(file) {
    return '/' + path.relative(this.rootDir, file);
  }
}

class Preview {
  constructor(rootDir) {
    this.contents = {};
    this.rootDir = rootDir;
    // this.serveBikeshedAtRoot = !fs.existsSync(path.join(rootDir, 'index.html')) && fs.existsSync(path.join(rootDir, 'index.bs'));
    this.serveBikeshedAtRoot = fs.existsSync(path.join(rootDir, 'index.bs'));
  }

  createMiddleware() {
    return this.middleware.bind(this);
  }

  middleware(req, res, next) {
    debug('middleware:', req.url);
    let pathname = urllib.parse(req.url).pathname;
    if (this.serveBikeshedAtRoot && pathname === '/') {
      req.url = '/index.bs';
    }
    let content = this.getContent(req.url);
    if (content) {
      res.setHeader('Content-Type', 'text/html');
      res.write(content);
      res.end();
      debug('middleware end');
      return;
    }
    next();
  }

  getContent(url) {
    debug('getContent:', url);
    let content = this.contents[url];
    if (content)
      return content;
    let ext = path.extname(url);
    if (ext == '.bs')
      return this.preprocess(url, bs2html);
    if (ext == '.dot')
      return this.preprocess(url, dot2html);
    return null;
  }

  setContent(url, content) {
    debug('setContent:', url, content.substr(0, 50));
    this.contents[url] = content;
  }

  setContentAsync(url, promise) {
    promise.then(content => {
      debug('content resolved', content.substr(0, 50));
      browserSync.notify(`Generated successfully`);
      this.setContent(url, content);
      browserSync.reload(url);
    }, error => {
      debug('content rejected', error);
      browserSync.notify(`Generated successfully`);
      this.setContent(url, `<!DOCTYPE html>
        <meta charset="utf-8"><style>body { color: #800; font: 1rem/1.5 monospace; padding: 30px; }</style>
        <body>
        <p><strong>Failed to generate content:</strong></p>
        <pre>${error.toString()}</pre>
        </body>`);
      browserSync.reload(url);
    });
  }

  toPath(url) {
    return path.join(this.rootDir, url);
  }

  preprocess(url, func) {
    let source = this.toPath(url);
    debug('preprocess:', url, source);
    let loadingContent = `<!DOCTYPE html><meta charset="utf-8"><style>body { font: 1rem/1.5 monospace; padding: 30px; }</style><body>Generating ${url} &hellip;</body>`;
    this.setContent(url, loadingContent);
    browserSync.watch(source).on('change', source => {
      browserSync.notify(`Generating ${url} &hellip;`);
      this.setContentAsync(url, func(source));
    });
    // TODO: Not sure why first reload fails without this timeout.
    setTimeout(() => {
      browserSync.notify(`Generating ${url} &hellip;`);
      this.setContentAsync(url, func(source));
    }, 500);
    return loadingContent;
  }
}

function bs2html(source) {
  const bikeshed =
    fs.existsSync('../bikeshed-js') ? require('../bikeshed-js') :
    require('bikeshed-js');
  return bikeshed(source, []).then(buffers =>
    Buffer.concat(buffers).toString('utf8'));
}

function dot2html(source) {
  return new Promise(function (resolve, reject) {
    const child_process = require('child_process');
    let child = child_process.spawnSync('dot', ['-Tsvg', source]);
    if (child.error) {
      log('dot2html', child.error, child.stderr);
      reject(child.error);
      return;
    }
    let content = child.stdout.toString();
    // Convert SVG to HTML.
    content = '<!DOCTYPE html>\n<body>\n' + content + '</body>\n';
    resolve(content);
  });
}

module.exports = BSCli;

new BSCli().run();
