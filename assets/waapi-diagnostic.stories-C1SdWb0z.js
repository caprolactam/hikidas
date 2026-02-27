import{j as r}from"./jsx-runtime-u17CrQMm.js";import{r as s}from"./iframe-ORiJVT8p.js";import{s as v}from"./spring-Yoh8F8YA.js";import{a as y,T as x,B as b}from"./common-2N8AbFhd.js";import"./preload-helper-PPVm8Dsz.js";const V={title:"Comparisons/WAAPI Diagnostic",tags:["test"],parameters:{layout:"fullscreen"}},S=-4;function w(t,n,e,o){t.finished.then(()=>{n.current===t&&(e.style.translate=o,n.current=null)}).catch(()=>{}).finally(()=>t.cancel())}function M({target:t}){const n=s.useRef(null),e=s.useRef(null),o=s.useRef(!1);return s.useLayoutEffect(()=>{const a=n.current;if(!a)return;const c=t?x:0,u=o.current,p=e.current;if(p){try{p.commitStyles()}catch{}p.cancel(),e.current=null}const m=parseFloat(getComputedStyle(a).translate?.split(" ")[0]??"0")||0,g=v({duration:600,bounce:.25,velocity:u&&m!==0&&m!==x?S:0}),i=new Animation(new KeyframeEffect(a,[{translate:`${m}px 0px 0px`},{translate:`${c}px 0px 0px`}],{duration:g.duration,easing:g.easing,fill:"forwards"}));e.current=i,o.current=!0,i.play(),w(i,e,a,`${c}px 0px 0px`)},[t]),r.jsx(R,{ref:n,color:"#111"})}function N({target:t}){const n=s.useRef(null),e=s.useRef(null),o=s.useRef(!1),a=s.useRef(null);return s.useLayoutEffect(()=>{const c=n.current;if(!c)return;const u=t?x:0,p=o.current,m=e.current;let l=0;if(m&&a.current){const{positionAt:j,startTime:A,fromX:h,toX:T}=a.current,C=performance.now()-A,E=j(C);l=h+(T-h)*E,c.style.translate=`${l}px 0px 0px`,m.cancel(),e.current=null}const i=v({duration:600,bounce:.25,velocity:p&&l!==0&&l!==x?S:0}),d=new Animation(new KeyframeEffect(c,[{translate:`${l}px 0px 0px`},{translate:`${u}px 0px 0px`}],{duration:i.duration,easing:i.easing,fill:"forwards"}));a.current={positionAt:i.positionAt,startTime:performance.now(),fromX:l,toX:u},e.current=d,o.current=!0,d.play(),w(d,e,c,`${u}px 0px 0px`)},[t]),r.jsx(R,{ref:n,color:"#b91c1c"})}const R=s.forwardRef(({color:t},n)=>r.jsx("div",{ref:n,style:{width:b,height:b,backgroundColor:t,borderRadius:8}})),f={render:()=>{const[t,n]=s.useState(!1);return r.jsxs("div",{className:"min-h-screen bg-yellow-100 p-10 flex flex-col items-center gap-6",children:[r.jsx("div",{className:"text-center max-w-lg",children:r.jsx("h1",{className:"text-xl font-bold mb-1",children:"commitStyles vs Math Sampling"})}),r.jsx("button",{onClick:()=>n(e=>!e),className:"px-6 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition",children:t?"← Left":"Right →"}),r.jsxs("div",{className:"flex flex-col gap-5",children:[r.jsx(y,{label:"A: commitStyles (current)",target:t,children:r.jsx(M,{target:t})}),r.jsx(y,{label:"B: Math sampling (Motion full path)",target:t,children:r.jsx(N,{target:t})})]})]})}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [target, setTarget] = useState(false);
    return <div className='min-h-screen bg-yellow-100 p-10 flex flex-col items-center gap-6'>
        <div className='text-center max-w-lg'>
          <h1 className='text-xl font-bold mb-1'>
            commitStyles vs Math Sampling
          </h1>
        </div>

        <button onClick={() => setTarget(t => !t)} className='px-6 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition'>
          {target ? '← Left' : 'Right →'}
        </button>

        <div className='flex flex-col gap-5'>
          <Track label='A: commitStyles (current)' target={target}>
            <CommitStylesBox target={target} />
          </Track>

          <Track label='B: Math sampling (Motion full path)' target={target}>
            <MathSamplingBox target={target} />
          </Track>
        </div>
      </div>;
  }
}`,...f.parameters?.docs?.source}}};const _=["CommitStylesVsMathSampling"];export{f as CommitStylesVsMathSampling,_ as __namedExportsOrder,V as default};
