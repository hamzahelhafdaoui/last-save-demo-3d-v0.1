// Check the actual exported MP4 in Chromium, including seeking across chapters.
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
  const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  try{
    const p=await b.newPage({viewport:{width:960,height:600}}),errors=[];
    p.on('pageerror',e=>errors.push(e.message));
    await p.setContent('<style>body{margin:0;background:#000}video{width:960px;height:600px}</style><video controls playsinline preload="auto" src="http://127.0.0.1:4191/video.mp4"></video>');
    await p.waitForFunction(()=>document.querySelector('video').readyState>=2,null,{timeout:60000});
    const metadata=await p.evaluate(()=>{const v=document.querySelector('video');return{duration:v.duration,width:v.videoWidth,height:v.videoHeight,error:v.error?.message||null};});
    if(metadata.error||metadata.width!==960||metadata.height!==600||metadata.duration<1100)throw Error(JSON.stringify(metadata));
    await p.evaluate(()=>document.querySelector('video').play());await p.waitForTimeout(1800);
    if(await p.evaluate(()=>document.querySelector('video').currentTime)<1)throw Error('Video did not advance');
    fs.mkdirSync('recordings/playback',{recursive:true});
    for(const t of [3,100,488,514,615,730,910,1094]){
      await p.evaluate(t=>new Promise((resolve,reject)=>{const v=document.querySelector('video');v.pause();v.addEventListener('seeked',resolve,{once:true});v.addEventListener('error',()=>reject(Error(v.error?.message)),{once:true});v.currentTime=t;}),t);
      await p.waitForTimeout(300);
      const actual=await p.evaluate(()=>document.querySelector('video').currentTime);
      if(Math.abs(actual-t)>.25)throw Error('Seek failed: requested '+t+', actual '+actual);
      await p.screenshot({path:'recordings/playback/'+t+'.png'});
    }
    if(errors.length)throw Error(errors.join('\n'));
    console.log('PASS browser playback and eight chapter seeks',JSON.stringify(metadata));
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
