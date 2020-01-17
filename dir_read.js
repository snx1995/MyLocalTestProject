const fs = require('fs');
const path = require('path');

function readDirs(p) {
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
        console.log(p +'\\')
        const files = fs.readdirSync(p);
        files.forEach(fileName => {
            readDirs(path.resolve(p, fileName));
        })
    } else {
        console.log(p)
    }
}

readDirs(path.resolve(__dirname, '../'));