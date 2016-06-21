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
  // Turn atomic off by default
  this.options.atomic = this.options.atomic === undefined ? false : this.options.atomic;
  // Turn string patterns into array
  this.patterns = [].concat(patterns);
  // Turn functions into array
  this.fileProcessor = [].concat(options.fileProcessor || []);
  // Remove fileMap from chokidar options
  delete (options.fileProcessor);
  // Initialize cache
  this.cache = {};
  // Watched files
  this.watched = [];
  // Initialize chokidar
  this.watcher = new Promise(function (resolve, reject) {
    var watcher = chokidar.watch(this.patterns, this.options);
    watcher.on('ready', resolve.bind(null, watcher));
    watcher.on('error', reject);
    watcher.on('add', function (file) {
      this.watched.push(path.join(this.options.cwd, file));
    }.bind(this));
    watcher.on('unlink', function (file) {
      var index = this.watched.indexOf(file);
      if (index !== -1) {
        this.watched.splice(index, 1);
      }
    }.bind(this));
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
  if (!this.isFileWatched(file)) {
    throw new Error('File ' + file + ' does not match any pattern');
  }
  return this.getFiles().then(function (files) {
    return files.indexOf(file) !== -1;
  });
};

/**
 * Returns a list of all existing files matching the pattern
 */
HotFileCache.prototype.getFiles = function () {
  return this.watcher.then(function (watcher) {
    return this.watched;
  }.bind(this));
};

/**
 * Reads a file and executes the file processors
 */
HotFileCache.prototype.readFile = function (file) {
  var cache = this.cache;
  var relativeFile = path.relative(this.options.cwd, file);
  if (!this.isFileWatched(file)) {
    throw new Error('File ' + file + ' does not match any pattern');
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
 * Returns true if the given file matches the current patterns.
 */
HotFileCache.prototype.isFileWatched = function (file) {
  var relativeFile = path.relative(this.options.cwd, file);
  return globule.isMatch(this.patterns, relativeFile);
};

/**
 * Invalidate cache
 */
HotFileCache.prototype.invalidateCache = function (reason, filepath) {
  if (this.cache[filepath]) {
    this.emit('cache-revoked', filepath);
  }
  delete this.cache[filepath];
};

module.exports = HotFileCache;
