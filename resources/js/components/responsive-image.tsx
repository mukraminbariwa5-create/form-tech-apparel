import type { ImgHTMLAttributes } from 'react';
import manifest from '../image-manifest.json';

type Entry = {width:number;height:number;sources:{url:string;width:number}[]};
const images:Record<string,Entry>=manifest;
export default function ResponsiveImage({src,alt,sizes='100vw',width,height,...props}:ImgHTMLAttributes<HTMLImageElement>) {
    const entry=src?images[src]:undefined;
    const fallback=entry?.sources.find(source=>source.width>=960)??entry?.sources.at(-1);
    return <img decoding="async" {...props} src={fallback?.url??src} srcSet={entry?.sources.map(source=>`${source.url} ${source.width}w`).join(', ')} sizes={entry?sizes:undefined} alt={alt??''} width={entry?.width??width} height={entry?.height??height}/>;
}
