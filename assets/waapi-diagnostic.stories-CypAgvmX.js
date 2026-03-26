import{a as e,n as t}from"./chunk-BneVvdWh.js";import{a as n}from"./iframe-1WKkNprc.js";import{t as r}from"./jsx-runtime-6sF1Ejqi.js";import{i,n as a,r as o,t as s}from"./common-DOjPdbx9.js";function c(e,t,n,r){e.finished.then(()=>{t.current===e&&(n.style.translate=r,t.current=null)}).catch(()=>{}).finally(()=>e.cancel())}function l({target:e}){let t=(0,d.useRef)(null),n=(0,d.useRef)(null),r=(0,d.useRef)(!1);return(0,d.useLayoutEffect)(()=>{let a=t.current;if(!a)return;let o=e?300:0,s=r.current,l=n.current;if(l){try{l.commitStyles()}catch{}l.cancel(),n.current=null}let u=parseFloat(getComputedStyle(a).translate?.split(` `)[0]??`0`)||0,d=i({duration:600,bounce:.25,velocity:s&&u!==0&&u!==300?m:0}),f=new Animation(new KeyframeEffect(a,[{translate:`${u}px 0px 0px`},{translate:`${o}px 0px 0px`}],{duration:d.duration,easing:d.easing,fill:`forwards`}));n.current=f,r.current=!0,f.play(),c(f,n,a,`${o}px 0px 0px`)},[e]),(0,f.jsx)(h,{ref:t,color:`#111`})}function u({target:e}){let t=(0,d.useRef)(null),n=(0,d.useRef)(null),r=(0,d.useRef)(!1),a=(0,d.useRef)(null);return(0,d.useLayoutEffect)(()=>{let o=t.current;if(!o)return;let s=e?300:0,l=r.current,u=n.current,d=0;if(u&&a.current){let{positionAt:e,startTime:t,fromX:r,toX:i}=a.current,s=e(performance.now()-t);d=r+(i-r)*s,o.style.translate=`${d}px 0px 0px`,u.cancel(),n.current=null}let f=i({duration:600,bounce:.25,velocity:l&&d!==0&&d!==300?m:0}),p=new Animation(new KeyframeEffect(o,[{translate:`${d}px 0px 0px`},{translate:`${s}px 0px 0px`}],{duration:f.duration,easing:f.easing,fill:`forwards`}));a.current={positionAt:f.positionAt,startTime:performance.now(),fromX:d,toX:s},n.current=p,r.current=!0,p.play(),c(p,n,o,`${s}px 0px 0px`)},[e]),(0,f.jsx)(h,{ref:t,color:`#b91c1c`})}var d,f,p,m,h,g,_;t((()=>{d=e(n()),o(),a(),f=r(),p={title:`Comparisons/WAAPI Diagnostic`,tags:[`test`],parameters:{layout:`fullscreen`}},m=-4,h=(0,d.forwardRef)(({color:e},t)=>(0,f.jsx)(`div`,{ref:t,style:{width:72,height:72,backgroundColor:e,borderRadius:8}})),g={render:()=>{let[e,t]=(0,d.useState)(!1);return(0,f.jsxs)(`div`,{className:`min-h-screen bg-yellow-100 p-10 flex flex-col items-center gap-6`,children:[(0,f.jsx)(`div`,{className:`text-center max-w-lg`,children:(0,f.jsx)(`h1`,{className:`text-xl font-bold mb-1`,children:`commitStyles vs Math Sampling`})}),(0,f.jsx)(`button`,{onClick:()=>t(e=>!e),className:`px-6 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition`,children:e?`← Left`:`Right →`}),(0,f.jsxs)(`div`,{className:`flex flex-col gap-5`,children:[(0,f.jsx)(s,{label:`A: commitStyles (current)`,target:e,children:(0,f.jsx)(l,{target:e})}),(0,f.jsx)(s,{label:`B: Math sampling (Motion full path)`,target:e,children:(0,f.jsx)(u,{target:e})})]})]})}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}},_=[`CommitStylesVsMathSampling`]}))();export{g as CommitStylesVsMathSampling,_ as __namedExportsOrder,p as default};