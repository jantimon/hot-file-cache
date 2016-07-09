## 1.0.0

- Forward chokidar the following events: `all`, `add`, `addDir`, `change`, `unlink` or `unlinkDir`

## 0.0.10

- Add `hot` option
- Add `close()` method

## 0.0.9

- Add method to invalidate the entire cache

## 0.0.8

- Support instantiation without options

## 0.0.7

- Fixed an issue where fileExits caused false positivs

## 0.0.6

- Set `atomic:false` by default for faster cache invalidation

## 0.0.5

- BREAKING CHANGE: `getFiles` returns absolute paths
- `readFile` throws if pattern does not match
- `fileExists` throws if pattern does not match
- add `isFileWatched`

## 0.0.4

- Fix windows and linux issues

## 0.0.3

- Add helper function `getFiles`

## 0.0.2

- Rename internal function `fileChangeHandler` to `invalidateCache`

## 0.0.1

- Initial Version
