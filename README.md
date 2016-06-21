Hot File Cache
========================================
[![npm version](https://badge.fury.io/js/hot-file-cache.svg)](http://badge.fury.io/js/hot-file-cache) [![Dependency Status](https://david-dm.org/jantimon/hot-file-cache.svg)](https://david-dm.org/jantimon/hot-file-cache) [![Build status](https://travis-ci.org/jantimon/hot-file-cache.svg)](https://travis-ci.org/jantimon/hot-file-cache) [![Build status](https://ci.appveyor.com/api/projects/status/u0798wdxt4qho7xq/branch/master?svg=true)](https://ci.appveyor.com/project/jantimon/hot-file-cache/branch/master)
 [![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

A file cache which will invalidate automatically if the source changes


Installation
------------

Install the plugin with npm:
```shell
$ npm install --save-dev hot-file-cache
```

Basic Usage
-----------
Add the plugin to your webpack config as follows:

```javascript
var hfc = new HotFileCache('*.md', {cwd: dir});
hfc.readFile('README.md').then(function(content) {
  console.log(content);
});
```

Processors


```javascript
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

All options except the `fileProcessor` are equal to [chokidar](https://github.com/paulmillr/chokidar#getting-started).

Visualisation
-----------

```javascript
var hfc = new HotFileCache('*.json', {
  cwd: dir,
  fileProcessor: function (filename, fileContent) {
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

# Changelog

Take a look at the  [CHANGELOG.md](https://github.com/jantimon/hot-file-cache/tree/master/CHANGELOG.md).


# Contribution

You're free to contribute to this project by submitting [issues](https://github.com/jantimon/hot-file-cache/issues) and/or [pull requests](https://github.com/jantimon/hot-file-cache/pulls). This project is test-driven, so keep in mind that every change and new feature should be covered by tests.
This project uses the [semistandard code style](https://github.com/Flet/semistandard).

# License

This project is licensed under [MIT](https://github.com/jantimon/hot-file-cache/blob/master/LICENSE).
