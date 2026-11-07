// PLAYWRIGHT_MODULE may point to an existing Playwright installation.
import { createRequire } from 'node:module';
const loadPlaywright = createRequire(import.meta.url);
const { chromium } = loadPlaywright(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs';
const output = 'coverage/scene-verification';
fs.mkdirSync(output, { recursive: true });

async function hoverParticle(page) {
  const point=await page.locator('canvas').evaluate(canvas=>{
    const ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    const bounds=canvas.getBoundingClientRect();
    for(let i=0;i<pixels.length;i+=16) if(pixels[i+3]>40) {
      const pixel=i/4;
      return {x:bounds.x+(pixel%canvas.width)*bounds.width/canvas.width,y:bounds.y+Math.floor(pixel/canvas.width)*bounds.height/canvas.height};
    }
    throw new Error('No visible particles');
  });
  await page.mouse.move(point.x,point.y);
  await page.waitForTimeout(100);
  assert.ok(Number(await page.locator('canvas').getAttribute('data-pointer-displacement'))>1,'hover must remain active in this phase');
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const results = [];
  try {
    for (const [width,height] of [[320,568],[390,844],[430,932],[768,1024],[1440,900],[844,390]]) {
      const context = await browser.newContext({ viewport:{width,height}, hasTouch:width<800 });
      const page = await context.newPage();
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
      await page.goto(process.env.SCENE_URL || 'http://127.0.0.1:3001');
      await page.locator('canvas[data-boot-stage]').waitFor();
      if(width===320) {
        assert.notEqual(await page.locator('canvas').getAttribute('data-boot-stage'),'ASSEMBLED');
        await hoverParticle(page);
      }
      await page.locator('#tab-content[aria-busy="false"]').waitFor();
      await page.waitForTimeout(650);
      assert.equal(await page.locator('canvas').count(),1);
      const canvas=await page.locator('canvas').boundingBox();
      assert.equal(canvas.width,width);assert.equal(canvas.height,height);
      for(const tab of ['SYSTEM','ARCHIVE','CORE','TERMINAL']) {
        await page.getByRole('tab',{name:tab,exact:true}).click();
        if(tab!=='SYSTEM') {
          assert.equal(await page.locator('#tab-content h1').count(),0,'content must wait for morph');
          await page.waitForTimeout(200);
          await hoverParticle(page);
        }
        await page.locator('#tab-content[aria-busy="false"]').waitFor();
        await page.screenshot({path:`${output}/${width}x${height}-${tab}.png`});
      }
      const screen=await page.locator('.terminal-screen').boundingBox();
      const geometry=await page.locator('[data-shape="0"]').boundingBox();
      assert.ok(geometry.x>=0 && geometry.y>=120 && geometry.x+geometry.width<=width && geometry.y+geometry.height<height-50,'entire CRT must fit');
      assert.ok(screen.x>geometry.x && screen.y>geometry.y && screen.x+screen.width<geometry.x+geometry.width);
      await page.locator('#contact-email').fill('test@example.com');
      assert.equal(await page.locator('#contact-email').inputValue(),'test@example.com');
      // Touch repulsion on a contour, then pointerup must restore rest.
      const touch=await context.newCDPSession(page);
      await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:geometry.x+8,y:geometry.y+20}]});
      await page.waitForTimeout(250);
      assert.ok(Number(await page.locator('canvas').getAttribute('data-pointer-displacement'))>1);
      await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForTimeout(1000);
      assert.ok(Number(await page.locator('canvas').getAttribute('data-pointer-displacement'))<.1);
      for(const tab of ['ARCHIVE','CORE','SYSTEM','TERMINAL']) {
        await page.getByRole('tab',{name:tab,exact:true}).click();await page.waitForTimeout(80);
      }
      await page.locator('#tab-content[aria-busy="false"]').waitFor();
      assert.equal(await page.locator('#terminal-heading').count(),1);
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.getByRole('tab',{name:'CORE',exact:true}).click();
      await page.locator('#core-heading').waitFor({timeout:500});
      assert.equal(await page.locator('canvas').getAttribute('data-pointer-displacement'),'0.00');
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.waitForTimeout(50);
      assert.equal(await page.locator('canvas').getAttribute('data-morph-progress'),'1');
      assert.deepEqual(errors,[]);
      results.push({width,height,frameMs:await page.locator('canvas').getAttribute('data-frame-ms'),particles:await page.locator('canvas').getAttribute('data-particle-count')});
      await context.close();
    }
    fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));
    console.log(JSON.stringify(results,null,2));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});


