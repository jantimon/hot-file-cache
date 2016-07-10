Hot File Cache
========================================
[![npm version](https://badge.fury.io/js/hot-file-cache.svg)](http://badge.fury.io/js/hot-file-cache) [![Dependency Status](https://david-dm.org/jantimon/hot-file-cache.svg)](https://david-dm.org/jantimon/hot-file-cache) [![Build status](https://travis-ci.org/jantimon/hot-file-cache.svg)](https://travis-ci.org/jantimon/hot-file-cache) [![Build status](https://ci.appveyor.com/api/projects/status/u0798wdxt4qho7xq/branch/master?svg=true)](https://ci.appveyor.com/project/jantimon/hot-file-cache/branch/master)
 [![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![Coverage Status](https://coveralls.io/repos/github/jantimon/hot-file-cache/badge.svg?branch=master)](https://coveralls.io/github/jantimon/hot-file-cache?branch=master)

A file/glob cache which will invalidate automatically if the source changes (powered by [chokidar](https://github.com/paulmillr/chokidar))

Installation
------------

Install the plugin with npm:
```shell
$ npm install --save-dev hot-file-cache
```

Basic Usage
-----------

```js
var hfc = new HotFileCache('*.md', {cwd: dir});
hfc.readFile('README.md').then(function(content) {
  console.log(content);
});
```

Processors
-----------

```js
var hfc = new HotFileCache('*.json', {
  cwd: dir,
  // the fileProcessor will be executed only once per file
  fileProcessor: function (filename, fileContent) {
    // the return value could also be a promise
    return JSON.parse(fileContent);
  }
});
hfc.readFile('demo.json').then(function(content) {
  console.log(content);
});
```

Options:
-----------

You can pass all [chokidar](https://github.com/paulmillr/chokidar#getting-started) options.

Additionally you can pass the following options:

+ `hot` (true|false) - Default: true - Wether to watch for changes or not
+ `useCache` (true|false) - Default: true - Wether to cache the disk operations
+ `fileProcessor`: (function) - Optional - Allow to process the file contents before they are written into the cache.


API:
-----------

Because of the asynchronous nature of disk operations all functions return a `Promise`.

`hfc.getFiles()`

getFiles returns an array of all absolute filenames matching the pattern. As it looks into a warm cache it doesn't need any disk operations.

`hfc.fileExists(absolutePath)`

fileExists returns true if the given file exists.  
As it looks in into a warm cache it doesn't need any disk operations.


`hfc.readFile(absolutePath)`

readFile returns the content of the given file.  
If a file processor is passed the content is also processed.
The processed result is cached until `chokidar` detects a file change on the disk.

`hfc.close()`

close will stop the file watching

Events
-----------

```js
hfc.on(eventName, callback);
```

  * `all` Similar to the chokidar all event: (`add`, `addDir`, `change`, `unlink` or `unlinkDir`)
  * `add` File has been added
  * `addDir` Directory has been added
  * `change` File has been changed
  * `unlink` File has been removed
  * `unlinkDir` Directory has been removed
  * `revoke-cache` File was already hot-cached but has been changed or was removed

Visualisation
-----------

```javascript
var hfc = new HotFileCache('*.json', {
  cwd: dir,
  fileProcessor: function process (filename, fileContent) {
    return JSON.parse(fileContent);
  }
});
hfc.readFile('demo.json') // 1
  .then(function(content) {
    console.log(content);
  });
hfc.readFile('demo.json') // 2
  .then(function(content) {
    console.log(content);
  });
hfc.readFile('demo.json') // 3
  .then(function(content) {
    console.log(content);
  });
hfc.readFile('demo.json') // 4
  .then(function(content) {
    console.log(content);
  });
```

[![Concept flow uml](https://raw.githubusercontent.com/jantimon/hot-file-cache/master/flow.png)](https://github.com/jantimon/hot-file-cache/blob/master/flow.puml)


Performance
-----------

Hot file cache uses the performance optimisations of chokidar which ensure that only one file listener is used even if multiple hot-file-caches wait for changes on the same directory or file. 

# Changelog

Take a look at the  [CHANGELOG.md](https://github.com/jantimon/hot-file-cache/tree/master/CHANGELOG.md).


# Contribution

You're free to contribute to this project by submitting [issues](https://github.com/jantimon/hot-file-cache/issues) and/or [pull requests](https://github.com/jantimon/hot-file-cache/pulls). This project is test-driven, so keep in mind that every change and new feature should be covered by tests.
This project uses the [semistandard code style](https://github.com/Flet/semistandard).

# License

This project is licensed under [MIT](https://github.com/jantimon/hot-file-cache/blob/master/LICENSE).
