import{g as u}from"./index-C9lD1M-P.js";function l(t,r){for(var n=0;n<r.length;n++){const e=r[n];if(typeof e!="string"&&!Array.isArray(e)){for(const a in e)if(a!=="default"&&!(a in t)){const s=Object.getOwnPropertyDescriptor(e,a);s&&Object.defineProperty(t,a,s.get?s:{enumerable:!0,get:()=>e[a]})}}}return Object.freeze(Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}))}var o,i;function d(){if(i)return o;i=1,o=t,t.displayName="jsstacktrace",t.aliases=[];function t(r){r.languages.jsstacktrace={"error-message":{pattern:/^\S.*/m,alias:"string"},"stack-frame":{pattern:/(^[ \t]+)at[ \t].*/m,lookbehind:!0,inside:{"not-my-code":{pattern:/^at[ \t]+(?!\s)(?:node\.js|<unknown>|.*(?:node_modules|\(<anonymous>\)|\(<unknown>|<anonymous>$|\(internal\/|\(node\.js)).*/m,alias:"comment"},filename:{pattern:/(\bat\s+(?!\s)|\()(?:[a-zA-Z]:)?[^():]+(?=:)/,lookbehind:!0,alias:"url"},function:{pattern:/(\bat\s+(?:new\s+)?)(?!\s)[_$a-zA-Z\xA0-\uFFFF<][.$\w\xA0-\uFFFF<>]*/,lookbehind:!0,inside:{punctuation:/\./}},punctuation:/[()]/,keyword:/\b(?:at|new)\b/,alias:{pattern:/\[(?:as\s+)?(?!\s)[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\]/,alias:"variable"},"line-number":{pattern:/:\d+(?::\d+)?\b/,alias:"number",inside:{punctuation:/:/}}}}}}return o}var c=d();const p=u(c),f=l({__proto__:null,default:p},[c]);export{f as j};
