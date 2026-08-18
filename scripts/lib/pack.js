'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AdmZip = require('adm-zip');

/** Recursively list files in a directory, returning paths relative to `dir`. */
function listFiles(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

/**
 * Create a zip archive of `sourceDir` placed under `topFolder/` inside the zip.
 * Returns { file, bytes, checksum, files }.
 */
function packDir(sourceDir, topFolder, outFile) {
  const zip = new AdmZip();
  const files = listFiles(sourceDir).sort();
  for (const rel of files) {
    const abs = path.join(sourceDir, rel);
    zip.addLocalFile(abs, path.posix.dirname(path.posix.join(topFolder, rel)) === '.' ? topFolder : path.posix.dirname(path.posix.join(topFolder, rel)));
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  zip.writeZip(outFile);
  const buf = fs.readFileSync(outFile);
  return {
    file: outFile,
    bytes: buf.length,
    checksum: 'sha256:' + crypto.createHash('sha256').update(buf).digest('hex'),
    files: files.map((f) => path.posix.join(topFolder, f)).sort()
  };
}

/** Return the sorted list of entry paths inside an existing zip. */
function listZipEntries(zipFile) {
  const zip = new AdmZip(zipFile);
  return zip
    .getEntries()
    .filter((e) => !e.isDirectory)
    .map((e) => e.entryName)
    .sort();
}

/** Compute sha256 (prefixed) of a file. */
function checksumFile(file) {
  const buf = fs.readFileSync(file);
  return 'sha256:' + crypto.createHash('sha256').update(buf).digest('hex');
}

module.exports = { listFiles, packDir, listZipEntries, checksumFile };
