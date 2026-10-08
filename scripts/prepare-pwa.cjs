const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),files=['index.html','manifest.json','offline.html'];
function walk(dir){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const f=path.join(dir,entry.name);if(entry.isDirectory())walk(f);else files.push(f);}}
for(const d of ['assets','icons','images'])walk(d);
for(const entry of fs.readdirSync(root)){if(/\.(jpg|png|webp)$/i.test(entry))files.push(entry);}
const hash=crypto.createHash('sha256');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8').replace(/const VERSION = '[^']+';/,"const VERSION = '__BUILD_HASH__';");
hash.update(sw);
for(const f of files.sort()){hash.update(f.split(path.sep).join('/'));hash.update(fs.readFileSync(path.join(root,f)));}
const version=hash.digest('hex').slice(0,16);
fs.writeFileSync(path.join(root,'sw.js'),sw.replace('__BUILD_HASH__',version));console.log('PWA version:',version);
