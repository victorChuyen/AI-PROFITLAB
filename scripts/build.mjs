import {cp,mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
const origin=process.env.SITE_ORIGIN || 'https://go.breaths.live';
if(!/^https:\/\/[^/]+$/.test(origin))throw new Error('SITE_ORIGIN must be an HTTPS origin without trailing slash');

for(const name of await readdir('dist')) {
  if(!name.endsWith('.html'))continue;
  let html=await readFile(`dist/${name}`,'utf8');
  html=html.replaceAll('https://ai.breaths.live',origin);
  html=html.replaceAll('https://go.breaths.live',origin);
  await writeFile(`dist/${name}`,html);
}
console.log('Built static assets for ' + origin + '. Pages Functions are compiled by Cloudflare from functions/.');

