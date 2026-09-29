import fs from 'fs';

async function inspectMSRIT() {
  try {
    const res = await fetch('https://www.msrit.edu/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const html = await res.text();
    console.log('Homepage HTML length:', html.length);

    // Find external JS files loaded on homepage
    const srcMatches = Array.from(html.matchAll(/src=["']([^"']+\.js[^"']*)["']/g)).map(m => m[1]);
    console.log('External JS files:', srcMatches);

    // Search for inline script tags
    const scripts = Array.from(html.matchAll(/<script[\s\S]*?<\/script>/gi)).map(m => m[0]);
    console.log('Total script tags:', scripts.length);

    for (let i = 0; i < scripts.length; i++) {
      const s = scripts[i];
      if (s.includes('news') || s.includes('event') || s.includes('Handlebars') || s.includes('Tabletop') || s.includes('google') || s.includes('json') || s.includes('api')) {
        console.log(`\n=== SCRIPT ${i} ===`);
        console.log(s.substring(0, 800));
      }
    }

    // Let's also fetch main.js or custom JS if present
    for (const src of srcMatches) {
      if (src.includes('main') || src.includes('custom') || src.includes('app') || src.includes('script') || src.includes('news') || src.includes('event')) {
        const fullUrl = src.startsWith('http') ? src : `https://www.msrit.edu/${src.replace(/^\//, '')}`;
        console.log(`\nFetching JS file: ${fullUrl}`);
        const jsRes = await fetch(fullUrl);
        const jsText = await jsRes.text();
        console.log(`JS File length: ${jsText.length}`);
        if (jsText.includes('news') || jsText.includes('event')) {
          const matches = jsText.match(/(https?:\/\/[^\s"'`]+|\/api\/[^\s"'`]+|\.json[^\s"'`]*)/g);
          console.log('URLs in JS file:', matches ? matches.slice(0, 10) : 'none');
          
          // Print snippet of JS around news / event loading
          const newsIdx = jsText.indexOf('news');
          if (newsIdx !== -1) {
            console.log('JS snippet around news:');
            console.log(jsText.substring(Math.max(0, newsIdx - 100), newsIdx + 400));
          }
        }
      }
    }

  } catch (err) {
    console.error('Error inspecting MSRIT:', err);
  }
}

inspectMSRIT();
