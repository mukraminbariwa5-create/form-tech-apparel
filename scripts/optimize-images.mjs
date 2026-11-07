import sharp from 'sharp';
import { readdir, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('public/images');
const manifest = {};
let sourceBytes = 0;
let outputBytes = 0;
for (const directory of ['campaign','collections','products']) {
    for (const file of (await readdir(path.join(root,directory))).filter(file => file.endsWith('.png')).sort()) {
        const input = path.join(root,directory,file);
        const metadata = await sharp(input).metadata();
        const widths = [...new Set([320,640,960,1440,1920].filter(w => w < metadata.width).concat(metadata.width))];
        const name = path.basename(file,'.png');
        const target = path.join(root,'responsive',directory);
        await mkdir(target,{recursive:true});
        const sources=[];
        for(const width of widths) {
            const url=`/images/responsive/${directory}/${name}-${width}.webp`;
            const result=await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:82,effort:5}).toFile(path.join('public',url));
            sources.push({url,width}); outputBytes+=result.size;
        }
        sourceBytes+=(await stat(input)).size;
        manifest[`/images/${directory}/${file}`]={width:metadata.width,height:metadata.height,sources};
    }
}
await writeFile('resources/js/image-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(`Prepared ${Object.keys(manifest).length} images. Source ${(sourceBytes/1e6).toFixed(2)} MB; all responsive derivatives ${(outputBytes/1e6).toFixed(2)} MB.`);
