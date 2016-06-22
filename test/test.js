import test from 'ava';
import HotFileCache from '..';
import denodeify from 'denodeify';
import path from 'path';

const copy = denodeify(require('ncp').ncp);
const mkdirp = denodeify(require('mkdirp'));
const rimraf = denodeify(require('rimraf'));
const readFile = denodeify(require('fs').readFile);
const writeFile = denodeify(require('fs').writeFile);
const unlink = denodeify(require('fs').unlink);

const tmp = path.resolve(__dirname, '..', 'tmp', 'testing');
const fixtures = path.resolve(__dirname, 'fixtures');
const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));
const fileEventDelay = 200;

let testDirId = 0;
async function createTestEnvironment() {
  const targetDir = path.resolve(tmp, 'test-' + testDirId++);
  await mkdirp(targetDir);
  await copy(fixtures, targetDir);
  await sleep(fileEventDelay);
  return targetDir;
}

test('reads file from disk', async t => {
    const dir = await createTestEnvironment();
    const cache = new HotFileCache('*.md', {cwd: dir});
    const expectedContent = await readFile(path.join(fixtures, 'file1.md'));
    const content = await cache.readFile(path.join(dir, 'file1.md'));
    t.is(content.toString(), expectedContent.toString());
    t.pass();
});

test('reads file from cache', async t => {
    const dir = await createTestEnvironment();
    const cache = new HotFileCache('*.md', {cwd: dir});
    let readEventsFired = 0;
    cache.on('read', () => readEventsFired++);
    const expectedContent = await readFile(path.join(fixtures, 'file1.md'));
    await cache.readFile(path.join(dir, 'file1.md'));
    await sleep(fileEventDelay);
    const content = await cache.readFile(path.join(dir, 'file1.md'));
    t.is(content.toString(), expectedContent.toString());
    t.is(readEventsFired, 1);
    t.pass();
});

test('reads file from cache even if it was changed', async t => {
    const dir = await createTestEnvironment();
    const cache = new HotFileCache('*.md', {cwd: dir});
    let readEventsFired = 0;
    cache.on('read', () => readEventsFired++);
    const expectedContent = await readFile(path.join(fixtures, 'file1.md'));
    const content = await cache.readFile(path.join(dir, 'file1.md'));
    t.is(content.toString(), expectedContent.toString());
    const newContent = 'demo';
    await writeFile(path.join(dir, 'file1.md'), newContent);
    await sleep(fileEventDelay);
    const newReadContent = await cache.readFile(path.join(dir, 'file1.md'));
    t.is(newReadContent.toString(), newContent);
    t.is(readEventsFired, 2);
    t.pass();
});

test('fileExists', async t => {
    const dir = await createTestEnvironment();
    const cache = new HotFileCache(['*.md', '**/*.json'], {cwd: dir});
    t.is(await cache.fileExists(path.join(dir, 'file1.md')), true);
    t.is(await cache.fileExists(path.join(dir, 'subdir', 'file2.json')), true);
    t.is(await cache.fileExists(path.join(dir, 'subdir', 'subsubdir', 'file3.json')), true);
    t.pass();
});

test('fileExists throws error if the file does not match the pattern', async t => {
    const dir = await createTestEnvironment();
    const cache = new HotFileCache(['*.md', '**/*.json'], {cwd: dir});
    let error;
    try {
        await cache.fileExists(path.join(dir, 'file0.txt'));
    } catch (e) {
        error = e;
    }
    t.regex(error, /does not match any pattern/);
    t.pass();
});

test('fileExists is updated if the file is removed', async t => {
    const dir = await createTestEnvironment();
    const cache = new HotFileCache(['*.md', '**/*.json'], {cwd: dir});
    const filename = path.join(dir, 'file1.md');
    t.is(await cache.fileExists(filename), true);
    await unlink(filename);
    await sleep(fileEventDelay);
    t.is(await cache.fileExists(filename), false);
    t.pass();
});

test('fileExists is updated if the folder is removed', async t => {
    const dir = await createTestEnvironment();
    const cache = new HotFileCache(['*.md', '**/*.json'], {cwd: dir});
    const filename = path.join(dir, 'subdir', 'file2.json');
    t.is(await cache.fileExists(filename), true);
    await rimraf(path.join(dir, 'subdir'));
    await sleep(fileEventDelay);
    t.is(await cache.fileExists(filename), false);
    t.pass();
});

test('fileRead throws error if the file does not match the pattern', async t => {
    const dir = await createTestEnvironment();
    const cache = new HotFileCache(['*.md', '**/*.json'], {cwd: dir});
    let error;
    try {
        await cache.readFile(path.join(dir, 'does-not-exist.txt'));
    } catch (e) {
        error = e;
    }
    t.regex(error, /does not match any pattern/);
    t.pass();
});

test('isFileWatched', async t => {
    const dir = await createTestEnvironment();
    const cache = new HotFileCache(['*.md', '**/*.json'], {cwd: dir});
    t.is(await cache.isFileWatched(path.join(dir, 'file1.md')), true);
    t.is(await cache.isFileWatched(path.join(dir, 'file0.txt')), false);
    t.pass();
});

test('get files', async t => {
    const dir = await createTestEnvironment();
    const processor = (file, fileContent) => JSON.parse(fileContent);
    const cache = new HotFileCache(['*.md', '**/*.json'], {cwd: dir, fileProcessor: processor});
    var result = await cache.getFiles();
    t.deepEqual(result, [
        path.join(dir, 'file1.md'), 
        path.join(dir, 'subdir', 'file2.json'),
        path.join(dir, 'subdir', 'subsubdir', 'file3.json')
    ]);
    t.pass();
});

test('file processor', async t => {
    const dir = await createTestEnvironment();
    const processor = (file, fileContent) => JSON.parse(fileContent);
    const cache = new HotFileCache(['**/*.json'], {cwd: dir, fileProcessor: processor});
    var result = await cache.readFile(path.join(dir, 'subdir', 'subsubdir', 'file3.json'));
    t.deepEqual(result, {foo: 'baz'});
    t.pass();
});

test('async file processor', async t => {
    const dir = await createTestEnvironment();
    const processor = (file, fileContent) => new Promise((resolve) => setTimeout(() => resolve(JSON.parse(fileContent))));
    const cache = new HotFileCache(['**/*.json'], {cwd: dir, fileProcessor: processor});
    var result = await cache.readFile(path.join(dir, 'subdir', 'subsubdir', 'file3.json'));
    t.deepEqual(result, {foo: 'baz'});
    t.pass();
});

test.after.always('cleanup', async t => {
  await rimraf(tmp);
});