import{a as e,n as t}from"./chunk-BneVvdWh.js";import{a as n}from"./iframe-BzOlYhL9.js";import{t as r}from"./jsx-runtime-6sF1Ejqi.js";import{a as i,c as a,d as o,i as s,l as c,n as l,o as u,r as d,s as f,t as p}from"./drawer-CUL4UbpL.js";var m,h,g,_,v,y,b,x,S;t((()=>{m=e(n()),o(),h=r(),g={title:`Drawer/Snap Points`,tags:[`test`],parameters:{layout:`fullscreen`}},_={render:()=>(0,h.jsx)(`div`,{className:`h-screen bg-slate-50 p-6`,children:(0,h.jsxs)(f,{snapPoints:[.2,.5,1],children:[(0,h.jsx)(c,{children:`Open Drawer`}),(0,h.jsxs)(u,{children:[(0,h.jsx)(i,{}),(0,h.jsxs)(l,{children:[(0,h.jsx)(s,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(a,{children:`Three Snap Points`}),(0,h.jsx)(d,{children:`Snap points at 25 %, 50 %, and 100 %. Drag slowly to snap to the nearest point, or flick quickly to jump further.`}),(0,h.jsx)(p,{children:`Close`})]})]})]})]})})},v={render:()=>(0,h.jsx)(`div`,{className:`min-h-screen bg-slate-50 p-6`,children:(0,h.jsxs)(f,{snapPoints:[.25,.5,1],defaultSnapPoint:1,children:[(0,h.jsx)(c,{children:`Open Drawer`}),(0,h.jsxs)(u,{children:[(0,h.jsx)(i,{}),(0,h.jsxs)(l,{children:[(0,h.jsx)(s,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(a,{children:`Default Snap Point at 50 %`}),(0,h.jsx)(d,{children:`Opens to the middle snap point (50 %) instead of the highest.`}),(0,h.jsx)(p,{children:`Close`})]})]})]})]})})},y={render:()=>{let[e,t]=(0,m.useState)(2),n=[.5,.75,1];return(0,h.jsx)(`div`,{className:`min-h-screen bg-slate-50 p-6`,children:(0,h.jsxs)(f,{snapPoints:n,snapPoint:e,onSnapPointChange:t,children:[(0,h.jsxs)(`div`,{className:`space-y-4`,children:[(0,h.jsxs)(`p`,{className:`text-sm text-slate-600`,children:[`Active Snap Index: `,e]}),(0,h.jsxs)(`p`,{className:`text-sm text-slate-600`,children:[`Active Snap Ratio: `,n[e]*100,`%`]}),(0,h.jsx)(c,{children:`Open Drawer`})]}),(0,h.jsxs)(u,{children:[(0,h.jsx)(i,{}),(0,h.jsxs)(l,{children:[(0,h.jsx)(s,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(a,{children:`Controlled Snap Points`}),(0,h.jsx)(d,{children:`Use buttons below to change snap point programmatically, or drag to change.`}),(0,h.jsx)(`div`,{className:`flex gap-2`,children:n.map((n,r)=>(0,h.jsxs)(`button`,{onClick:()=>t(r),className:`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${e===r?`border-slate-900 bg-slate-900 text-white`:`border-slate-300 text-slate-700 hover:bg-slate-100`}`,children:[n*100,`%`]},r))}),(0,h.jsx)(p,{children:`Close`})]})]})]})]})})}},b={render:()=>(0,h.jsx)(`div`,{className:`h-screen bg-slate-50 p-6`,children:(0,h.jsxs)(f,{snapPoints:[.6],children:[(0,h.jsx)(c,{children:`Open Drawer`}),(0,h.jsxs)(u,{children:[(0,h.jsx)(i,{}),(0,h.jsxs)(l,{children:[(0,h.jsx)(s,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(a,{children:`Single Snap Point (60 %)`}),(0,h.jsx)(d,{children:`Toggles between closed and 60 % height.`}),(0,h.jsx)(p,{children:`Close`})]})]})]})]})})},x={render:()=>{let[e,t]=(0,m.useState)(1),n=[.5,1];return(0,h.jsx)(`div`,{className:`h-screen bg-slate-50 p-6`,children:(0,h.jsxs)(f,{disableDragDismiss:!0,snapPoints:n,snapPoint:e,onSnapPointChange:t,children:[(0,h.jsx)(c,{children:`Open Drawer`}),(0,h.jsxs)(u,{children:[(0,h.jsx)(i,{}),(0,h.jsxs)(l,{children:[(0,h.jsx)(s,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(a,{children:`Snap Points + Dismiss Disabled`}),(0,h.jsx)(d,{children:`Snap points at 30 %, 60 %, 100 %. Dragging below 30 % shows rubber-band but won't close. Use Close button, ESC, or overlay.`}),(0,h.jsx)(`div`,{className:`flex gap-2`,children:n.map((n,r)=>(0,h.jsxs)(`button`,{onClick:()=>t(r),className:`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${e===r?`border-slate-900 bg-slate-900 text-white`:`border-slate-300 text-slate-700 hover:bg-slate-100`}`,children:[n*100,`%`]},r))}),(0,h.jsx)(p,{children:`Close`})]})]})]})]})})}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: () => {
    const snapPoints = [0.2, 0.5, 1.0];
    return <div className='h-screen bg-slate-50 p-6'>
        <Root snapPoints={snapPoints}>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Three Snap Points</Title>
                <Description>
                  Snap points at 25 %, 50 %, and 100 %. Drag slowly to snap to
                  the nearest point, or flick quickly to jump further.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>;
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => {
    return <div className='min-h-screen bg-slate-50 p-6'>
        <Root snapPoints={[0.25, 0.5, 1.0]} defaultSnapPoint={1}>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Default Snap Point at 50 %</Title>
                <Description>
                  Opens to the middle snap point (50 %) instead of the highest.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>;
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [activeSnap, setActiveSnap] = useState(2);
    const snapPoints = [0.5, 0.75, 1.0];
    return <div className='min-h-screen bg-slate-50 p-6'>
        <Root snapPoints={snapPoints} snapPoint={activeSnap} onSnapPointChange={setActiveSnap}>
          <div className='space-y-4'>
            <p className='text-sm text-slate-600'>
              Active Snap Index: {activeSnap}
            </p>
            <p className='text-sm text-slate-600'>
              Active Snap Ratio: {snapPoints[activeSnap]! * 100}%
            </p>
            <Trigger>Open Drawer</Trigger>
          </div>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Controlled Snap Points</Title>
                <Description>
                  Use buttons below to change snap point programmatically, or
                  drag to change.
                </Description>
                <div className='flex gap-2'>
                  {snapPoints.map((sp, i) => <button key={i} onClick={() => setActiveSnap(i)} className={\`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition \${activeSnap === i ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}\`}>
                      {sp * 100}%
                    </button>)}
                </div>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>;
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => {
    return <div className='h-screen bg-slate-50 p-6'>
        <Root snapPoints={[0.6]}>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Single Snap Point (60 %)</Title>
                <Description>
                  Toggles between closed and 60 % height.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>;
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [activeSnap, setActiveSnap] = useState(1);
    const snapPoints = [0.5, 1.0];
    return <div className='h-screen bg-slate-50 p-6'>
        <Root disableDragDismiss snapPoints={snapPoints} snapPoint={activeSnap} onSnapPointChange={setActiveSnap}>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Snap Points + Dismiss Disabled</Title>
                <Description>
                  Snap points at 30 %, 60 %, 100 %. Dragging below 30 % shows
                  rubber-band but won't close. Use Close button, ESC, or
                  overlay.
                </Description>
                <div className='flex gap-2'>
                  {snapPoints.map((sp, i) => <button key={i} onClick={() => setActiveSnap(i)} className={\`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition \${activeSnap === i ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}\`}>
                      {sp * 100}%
                    </button>)}
                </div>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>;
  }
}`,...x.parameters?.docs?.source}}},S=[`SnapPoints`,`SnapPointsWithDefaultIndex`,`ControlledSnapPoints`,`SingleSnapPoint`,`SnapPointsWithDisableDragDismiss`]}))();export{y as ControlledSnapPoints,b as SingleSnapPoint,_ as SnapPoints,v as SnapPointsWithDefaultIndex,x as SnapPointsWithDisableDragDismiss,S as __namedExportsOrder,g as default};