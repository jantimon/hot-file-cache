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
var cache = new HotFileCache('*.md', {cwd: dir});
cache.readFile('README.md').then(function(content) {
  console.log(content);
});
```

Processors


```javascript
var cache = new HotFileCache('*.md', {
  cwd: dir,
  fileProcessor: function (fileContent) {
    return JSON.parse(fileContent);
  }
});
cache.readFile('README.md').then(function(content) {
  console.log(content);
});
```


# Changelog

Take a look at the  [CHANGELOG.md](https://github.com/jantimon/favicons-webpack-plugin/tree/master/CHANGELOG.md).


# Contribution

You're free to contribute to this project by submitting [issues](https://github.com/jantimon/favicons-webpack-plugin/issues) and/or [pull requests](https://github.com/jantimon/favicons-webpack-plugin/pulls). This project is test-driven, so keep in mind that every change and new feature should be covered by tests.
This project uses the [semistandard code style](https://github.com/Flet/semistandard).

# License

This project is licensed under [MIT](https://github.com/jantimon/favicons-webpack-plugin/blob/master/LICENSE).