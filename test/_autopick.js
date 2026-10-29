// Автоподбор на реальной картинке: что выберется и за сколько.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const snap = fs.readFileSync(process.argv[2], 'utf8');
const src = fs.readFileSync(process.env.MOD || path.join(__dirname, '..', 'ITD-Visual-Pack.user.js'), 'utf8');
const IMG = 'data:image/jpeg;base64,' + fs.readFileSync('C:\\Code\\MK2_V2\\agent\\_u.b64', 'utf8').trim();
const ORIGIN = 'https://xn--d1ah4a.com';

(async () => {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
    const p = await ctx.newPage();
    await p.route('**/*', async r => {
        const u = new URL(r.request().url()), t = r.request().resourceType();
        if (u.origin === ORIGIN && t === 'document') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: snap });
        if (t === 'image' || t === 'font') return r.abort();
        if (t === 'stylesheet') return r.continue();
        if (u.pathname.includes('/auth/refresh')) return r.fulfill({ contentType: 'application/json', body: '{"accessToken":"t"}' });
        if (u.pathname === '/api/users/me') return r.fulfill({ contentType: 'application/json', body: '{"username":"NeuroSFW","id":"u1"}' });
        return r.fulfill({ status: 404, body: '' });
    });
    await p.addInitScript(() => {
        const st = { palMiku: false, palTeto: false, palsEnabled: false, introEnabled: false, backgroundEnabled: false };
        window.GM_getValue = (k, d) => (k in st ? st[k] : d);
        window.GM_setValue = () => { };
        window.GM_registerMenuCommand = () => { };
        window.GM_xmlhttpRequest = o => setTimeout(() => o.onerror && o.onerror('x'), 0);
        window.GM_info = { script: { version: 't' } };
        window.unsafeWindow = window;
    });
    await p.goto(ORIGIN + '/');
    await p.addScriptTag({ content: src });
    await p.waitForTimeout(500);
    const res = await p.evaluate(async (imgUrl) => {
        const W = 1100, H = 380;
        const img = new Image(); img.crossOrigin = 'anonymous';
        await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = imgUrl; });
        const c = document.createElement('canvas'); c.width = W; c.height = H;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#141018'; ctx.fillRect(0, 0, W, H);
        const s = Math.max(W / img.width, H / img.height);
        ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
        const data = ctx.getImageData(0, 0, W, H);
        const t0 = performance.now();
        // список вариантов
        const cands = [];
        for (const brush of [4,6,8,10,12,16]) for (const thr of [15,25,40,60]) cands.push({kind:'lines',a:brush,b:thr});
        for (const g of [[6,4],[8,4],[6,6],[8,6],[8,8],[10,6],[10,8],[10,10],[12,8],[12,10],[12,12],[14,10]]) for (const thr of [20,25,30,35,40]) cands.push({kind:'blocks',a:g[0],b:g[1],thr});
        // упрощённые копии функций
        const hex = (r,g,b)=>'#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
        function linesOps(d, W,H,brush,thr){const ops=[];const th2=thr*thr;for(let y=0;y<H;y+=brush){const yc=Math.min(y+Math.floor(brush/2),H-1);const rowOff=yc*W*4;let st=0,sr=0,sg=0,sb=0,n=0;for(let x=0;x<W;x++){const o=rowOff+x*4,r=d[o],g=d[o+1],b=d[o+2];if(n===0){sr=r;sg=g;sb=b;n=1;continue;}const ar=sr/n,ag=sg/n,ab=sb/n;const dr=r-ar,dg=g-ag,db=b-ab;if(dr*dr+dg*dg+db*db<th2){sr+=r;sg+=g;sb+=b;n++;}else{ops.push({color:hex(Math.round(sr/n),Math.round(sg/n),Math.round(sb/n)),width:brush,points:[[st,yc],[x-1,yc]]});st=x;sr=r;sg=g;sb=b;n=1;}}ops.push({color:hex(Math.round(sr/n),Math.round(sg/n),Math.round(sb/n)),width:brush,points:[[st,yc],[W-1,yc]]});}return ops;}
        function blocksOps(d,W,H,bw,bh,thr){const th2=thr*thr;const ops=[];const nC=Math.ceil(W/bw);for(let y=0;y<H;y+=bh){const y1=Math.min(y+bh,H),yc=Math.min(y+Math.floor(bh/2),H-1);const cols=[];for(let cc=0;cc<nC;cc++){const x0=cc*bw,x1=Math.min(x0+bw,W);let sr=0,sg=0,sb=0,n=0;for(let yy=y;yy<y1;yy++){let o=(yy*W+x0)*4;for(let xx=x0;xx<x1;xx++,o+=4){sr+=d[o];sg+=d[o+1];sb+=d[o+2];n++;}}cols.push([sr/n,sg/n,sb/n]);}let st=0,csr=cols[0][0],csg=cols[0][1],csb=cols[0][2],cnt=1;for(let c2=1;c2<nC;c2++){const ar=csr/cnt,ag=csg/cnt,ab=csb/cnt;const dr=cols[c2][0]-ar,dg=cols[c2][1]-ag,db=cols[c2][2]-ab;if(dr*dr+dg*dg+db*db<th2){csr+=cols[c2][0];csg+=cols[c2][1];csb+=cols[c2][2];cnt++;}else{ops.push({color:hex(Math.round(csr/cnt),Math.round(csg/cnt),Math.round(csb/cnt)),width:bh,points:[[st*bw,yc],[c2*bw-1,yc]]});st=c2;csr=cols[c2][0];csg=cols[c2][1];csb=cols[c2][2];cnt=1;}}ops.push({color:hex(Math.round(csr/cnt),Math.round(csg/cnt),Math.round(csb/cnt)),width:bh,points:[[st*bw,yc],[W-1,yc]]});}return ops;}
        const cv=document.createElement('canvas');cv.width=W;cv.height=H;
        const cx=cv.getContext('2d',{willReadFrequently:true});
        function score(ops){cx.fillStyle='#141018';cx.fillRect(0,0,W,H);for(const op of ops){cx.strokeStyle=op.color;cx.lineWidth=op.width;cx.lineCap='round';cx.beginPath();cx.moveTo(op.points[0][0]+0.5,op.points[0][1]+0.5);cx.lineTo(op.points[1][0]+0.5,op.points[1][1]+0.5);cx.stroke();}const rd=cx.getImageData(0,0,W,H).data;const od=data.data;let s2=0,n=0;for(let i=0;i<od.length;i+=16){const dr=od[i]-rd[i],dg=od[i+1]-rd[i+1],db=od[i+2]-rd[i+2];s2+=dr*dr+dg*dg+db*db;n+=3;}return Math.sqrt(s2/n);}
        let best=null;
        for(const c of cands){const ops=c.kind==='lines'?linesOps(data.data,W,H,c.a,c.b):blocksOps(data.data,W,H,c.a,c.b,c.thr);if(ops.length>1990)continue;const sc=score(ops);if(!best||sc<best.sc)best={sc,label:c.kind==='lines'?(c.a+'px/'+c.b):(c.a+'x'+c.b+'/'+c.thr),ops:ops.length};}
        const ms=Math.round(performance.now()-t0);
        return {ms, best};
    }, IMG);
    console.log(JSON.stringify(res, null, 1));
    await b.close();
})();
