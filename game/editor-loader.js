// Keep the workshop usable when a designer opens editor.html directly from
// Finder. Chromium blocks ES module graphs loaded from file://, so the local
// path uses the generated classic bundle; HTTP and sneakers:// keep the source
// module for normal development and test tooling.
const script = document.createElement('script');
if (location.protocol === 'file:') script.src = 'game/editor.bundle.js';
else { script.type = 'module'; script.src = 'game/editor.js?v=12'; }
document.currentScript.after(script);
