// Chromium blocks ES module graphs loaded from file://. Use the generated
// classic bundle for a direct local launch; HTTP and sneakers:// use source
// modules for development and the packaged desktop app.
const script = document.createElement('script');
const version = '?v=18';
if (location.protocol === 'file:') script.src = `game/app.bundle.js${version}`;
else { script.type = 'module'; script.src = `game/app.js${version}`; }
document.currentScript.after(script);
