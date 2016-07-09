'use strict';
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
  // Use a cache by default
  this.options.isCachingEnabled = this.options.useCache === undefined ? true : this.options.useCache;
  // Turn atomic off by default
  this.options.atomic = this.options.atomic === undefined ? false : this.options.atomic;
  // Turn string patterns into array
  this.patterns = [].concat(patterns);
  // Turn functions into array
  this.fileProcessor = [].concat(this.options.fileProcessor || []);
  // Remove fileMap from chokidar options
  delete (this.options.fileProcessor);
  // Initialize cache
  this.cache = {};
  // Watched files
  this.watched = [];
  // Initialize chokidar
  this.watcher = new Promise(function (resolve, reject) {
    var watcher = chokidar.watch(this.patterns, this.options);
    watcher.on('ready', resolve.bind(null, watcher));
    watcher.on('error', reject);
    // Add files to the internal `getFiles` cache on creation
    watcher.on('add', function (file) {
      this.watched.push(path.join(this.options.cwd, file));
    }.bind(this));
    // Remove files from the internal `getFiles` cache on deletion
    watcher.on('unlink', function (file) {
      var index = this.watched.indexOf(path.join(this.options.cwd, file));
      /* istanbul ignore else */
      if (index !== -1) {
        this.watched.splice(index, 1);
      }
    }.bind(this));
  }.bind(this));
  // Init watcher
  this.watcher.then(function (watcher) {
    // Invalidate files on file changes
    watcher.on('all', this.invalidateCache.bind(this));
    // Forward chokidar 'all' event
    // https://github.com/paulmillr/chokidar#methods--events
    watcher.on('all', this.emit.bind(this, 'all'));
    // https://github.com/paulmillr/chokidar#methods--events
    // Forward the following events: add, addDir, change, unlink, unlinkDir
    watcher.on('all', this.emit.bind(this));
  }.bind(this));
  // Allow to disable the hot feature
  if (this.options.hot === false) {
    this.close();
  }
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
    if (cache[relativeFile]) {
      return cache[relativeFile];
    }
    var processedFile = readFile(file).then(function (fileContent) {
      var result = Promise.resolve(fileContent);
      this.fileProcessor.forEach(function (processor) {
        result = result.then(function (content) {
          return processor(file, content);
        });
      });
      return result;
    }.bind(this));
    this.emit('read', file);
    if (this.options.isCachingEnabled) {
      cache[relativeFile] = processedFile;
    }
    return processedFile;
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
    this.emit('cache-revoked', filepath, reason);
  }
  delete this.cache[filepath];
};

/**
 * Invalidate entire cache
 */
HotFileCache.prototype.invalidateEntireCache = function (reason) {
  Object.keys(this.cache).forEach(this.invalidateCache.bind(this, reason));
};

/**
 * Stop file watching
 */
HotFileCache.prototype.close = function () {
  this.watcher.then(function (watcher) {
    watcher.close();
  });
};

module.exports = HotFileCache;
