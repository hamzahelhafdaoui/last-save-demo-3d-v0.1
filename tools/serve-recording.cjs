// Local MP4 review server with byte ranges, required for reliable browser seeks.
const http=require('node:http'),fs=require('node:fs');
const file=process.env.VIDEO_PATH||'/workspace/deliverables/last-save-main-complete-playthrough.mp4';
http.createServer((req,res)=>{
  const size=fs.statSync(file).size,match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  const start=match?Number(match[1]):0,end=match&&match[2]?Math.min(Number(match[2]),size-1):size-1;
  if(start>=size||end<start){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}
  const headers={'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':end-start+1,'Access-Control-Allow-Origin':'*'};
  if(match)headers['Content-Range']=`bytes ${start}-${end}/${size}`;
  res.writeHead(match?206:200,headers);
  if(req.method==='HEAD')return res.end();
  const stream=fs.createReadStream(file,{start,end});stream.pipe(res);res.on('close',()=>stream.destroy());
}).listen(4191,'127.0.0.1',()=>console.log('Review video at http://127.0.0.1:4191/video.mp4'));
