var inkstone=function(n){"use strict";return n.Container=class{constructor(){this.container=new Map}bind(n,e){this.container.set(n,{callback:(...n)=>new e(...n),singleton:!1})}use(n,...e){let t=this.container.get(n);if(void 0===t)throw new Error("not found this instance which in container");return t.singleton&&!t.instance&&(t.instance=t.callback()),t.singleton?t.instance:t?.callback(...e)}restore(n){this.container.delete(n)}},n.InkStone="hello inkstone",Object.defineProperty(n,"__esModule",{value:!0}),n}({});