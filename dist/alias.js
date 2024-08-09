"use strict";
// alias.js
const path = require('path');
const moduleAlias = require('module-alias');
const env = process.env.NODE_ENV || 'development';
function getPath(path, key) {
    const _str = `${key}/${key}`;
    if (path.includes(_str)) {
        return path.replace(_str, key);
    }
    return path;
}
if (env === 'production') {
    const _path = getPath(path.join(__dirname, 'dist'), 'dist');
    moduleAlias.addAlias('@', _path);
}
else {
    const _path = getPath(path.join(__dirname, 'src'), 'src');
    moduleAlias.addAlias('@', path.join(__dirname, ''));
}
