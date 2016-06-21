var path = require('path');
var denodeify = require('denodeify');
var globule = require('globule');
var chokidar = require('chokidar');
var readFile = denodeify(require('fs').readFile);
var EventEmitter = require('events').EventEmitter;

function HotFileCache (patterns, options) {
  this.options = Object.assign({}, options || {});
  if (!this.options.cwd) {
    this.options.cwd = process.cwd();
  }
  // Turn string patterns into array
  this.patterns = [].concat(patterns);
  // Turn functions into array
  this.fileProcessor = [].concat(options.fileProcessor || []);
  // Remove fileMap from chokidar options
  delete (options.fileProcessors);
  // Initialize cache
  this.cache = {};
  // Initialize chokidar
  this.watcher = new Promise(function (resolve, reject) {
    var watcher = chokidar.watch(this.patterns, this.options);
    watcher.on('ready', resolve.bind(null, watcher));
    watcher.on('error', reject);
  }.bind(this));
  // Init watcher on file changes
  this.watcher.then(function (watcher) {
    watcher.on('all', this.invalidateCache.bind(this));
  }.bind(this));
}

Object.setPrototypeOf(HotFileCache.prototype, EventEmitter.prototype);

/**
 * Returns true if the given file exists
 */
HotFileCache.prototype.fileExists = function (file) {
  var relativeFile = path.relative(this.options.cwd, file);
  return this.watcher.then(function (watcher) {
    var files = watcher.getWatched();
    return files[path.dirname(relativeFile) || '.'].indexOf(path.basename(relativeFile)) !== -1;
  });
};

/**
 * Reads a file and executes the file processors
 */
HotFileCache.prototype.readFile = function (file) {
  var cache = this.cache;
  var relativeFile = path.relative(this.options.cwd, file);
  if (!globule.isMatch(this.patterns, relativeFile)) {
    return Promise.reject('File ' + file + ' does not match any pattern');
  }
  return this.watcher.then(function () {
    if (!cache[relativeFile]) {
      cache[relativeFile] = readFile(file).then(function (fileContent) {
        var result = Promise.resolve(fileContent);
        this.fileProcessor.forEach(function (processor) {
          result = result.then(function (content) {
            return processor(file, content);
          });
        });
        return result;
      }.bind(this));
      this.emit('read', file);
    }
    return cache[relativeFile];
  }.bind(this));
};

/**
 * invalidate cache
 */
HotFileCache.prototype.invalidateCache = function (reason, filepath) {
  this.emit('cache-revoked', filepath);
  delete this.cache[filepath];
};

module.exports = HotFileCache;
