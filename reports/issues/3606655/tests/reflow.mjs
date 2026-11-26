import { chromium } from 'playwright';
const bases={before:'https://repro-baseline-3606655.ddev.site',after:'https://repro-issue-3606655.ddev.site'};
const browser=await chromium.launch({channel:'chrome'});
for(const [side,base] of Object.entries(bases)){
  const ctx=await browser.newContext({viewport:{width:320,height:900}});
  const p=await ctx.newPage();
  await p.goto(`${base}/user/login`,{waitUntil:'domcontentloaded'});
  await p.fill('#edit-name','admin');await p.fill('#edit-pass','admin');
  await Promise.all([p.waitForLoadState('domcontentloaded'),p.click('#edit-submit')]);
  await p.goto(`${base}/user/edit`,{waitUntil:'domcontentloaded'});
  const at320=await p.evaluate(()=>({inner:window.innerWidth,scroll:document.documentElement.scrollWidth,over:document.documentElement.scrollWidth>window.innerWidth+1}));
  await p.setViewportSize({width:1280,height:900});
  const at1280=await p.evaluate(()=>({inner:window.innerWidth,scroll:document.documentElement.scrollWidth,over:document.documentElement.scrollWidth>window.innerWidth+1}));
  console.log(side,JSON.stringify({at320,at1280}));
  await ctx.close();
}
await browser.close();
