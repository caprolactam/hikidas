import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as I}from"./iframe-CU1OH3mJ.js";import{D as m}from"./drawer-CRoqalc2.js";import"./preload-helper-PPVm8Dsz.js";import"./drawer-adapter-xW1zTYYn.js";import"./use-static-b41ELNWf.js";import"./spring-Yoh8F8YA.js";import"./index-BX2HJR2s.js";import"./index-Bi-EWYOf.js";const o=m.Root,A="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800";function i({children:s="Open Drawer"}){return e.jsx(m.Trigger,{className:A,children:s})}const l=m.Portal;function t(){return e.jsx(m.Overlay,{className:"fixed inset-0 bg-black/50","data-testid":"overlay"})}function c({children:s}){return e.jsx(m.Content,{className:"fixed bottom-0 inset-x-0 bg-white h-75 rounded-t-3xl border border-slate-200",children:s})}function d(){return e.jsx("div",{className:"flex justify-center pt-3 pb-2","data-testid":"drag-handle",children:e.jsx("div",{className:"h-1 w-12 rounded-full bg-slate-300"})})}function r({children:s}){return e.jsx(m.Title,{className:"text-lg font-semibold",children:s})}function a({children:s}){return e.jsx(m.Description,{className:"text-sm leading-relaxed text-slate-600",children:s})}const H="inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100";function p({children:s="Close"}){return e.jsx(m.Close,{className:H,children:s})}i.__docgenInfo={description:"",methods:[],displayName:"Trigger",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"",defaultValue:{value:"'Open Drawer'",computed:!1}}}};t.__docgenInfo={description:"",methods:[],displayName:"Overlay"};c.__docgenInfo={description:"",methods:[],displayName:"Content",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};d.__docgenInfo={description:"",methods:[],displayName:"DummyHandle"};r.__docgenInfo={description:"",methods:[],displayName:"Title",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};a.__docgenInfo={description:"",methods:[],displayName:"Description",props:{children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};p.__docgenInfo={description:"",methods:[],displayName:"Close",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"",defaultValue:{value:"'Close'",computed:!1}}}};const L={title:"Drawer",tags:["test"],parameters:{layout:"fullscreen"}},g={render:()=>e.jsx("div",{className:"h-screen w-full bg-slate-50 p-6",children:e.jsxs(o,{children:[e.jsx(i,{children:"Open Drawer"}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(c,{children:[e.jsx(d,{}),e.jsxs("div",{className:"space-y-4 px-6 pb-6",children:[e.jsx(r,{children:"Basic Drawer"}),e.jsx(a,{children:"Drag down to close, or click outside / press ESC."}),e.jsx(p,{children:"Close"})]})]})]})]})})},b={render:()=>e.jsx("div",{className:"h-screen w-full bg-slate-50 p-6",children:e.jsxs(o,{defaultOpen:!0,children:[e.jsx(i,{children:"Open Drawer"}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(c,{children:[e.jsx(d,{}),e.jsxs("div",{className:"space-y-4 px-6 pb-6",children:[e.jsx(r,{children:"Basic Drawer"}),e.jsx(a,{children:"Drag down to close, or click outside / press ESC."}),e.jsx(p,{children:"Close"})]})]})]})]})})},j={render:()=>{const[s,n]=I.useState(!1);return e.jsx("div",{className:"h-screen w-full bg-slate-50 p-6",children:e.jsxs(o,{open:s,onOpenChange:n,children:[e.jsx("button",{type:"button",className:A,onClick:()=>n(!0),children:"Open Drawer"}),e.jsxs("p",{className:"text-sm text-slate-600","data-testid":"state",children:["State: ",e.jsx("strong",{children:s?"Open":"Closed"})]}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(c,{children:[e.jsx(d,{}),e.jsxs("div",{className:"space-y-4 px-6 pb-6",children:[e.jsx(r,{children:"Basic Drawer"}),e.jsx(a,{children:"Drag down to close, or click outside / press ESC."}),e.jsx("button",{type:"button",className:H,onClick:()=>n(!1),children:"Close"})]})]})]})]})})}},v={render:()=>{const[s,n]=I.useState(!0);return e.jsx("div",{className:"h-screen w-full bg-slate-50 p-6",children:e.jsxs(o,{open:s,onOpenChange:n,children:[e.jsx(i,{children:"Open Drawer"}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(c,{children:[e.jsx(d,{}),e.jsxs("div",{className:"space-y-4 px-6 pb-6",children:[e.jsx(r,{children:"Basic Drawer"}),e.jsx(a,{children:"Drag down to close, or click outside / press ESC."}),e.jsx(p,{children:"Close"})]})]})]})]})})}};function _({direction:s}){const x=s==="down"||s==="up"?s==="down"?"fixed bottom-0 inset-x-0 bg-white h-[40vh] rounded-t-3xl border border-slate-200":"fixed top-0 inset-x-0 bg-white h-[40vh] rounded-b-3xl border border-slate-200":s==="left"?"fixed left-0 inset-y-0 bg-white w-[300px] rounded-r-3xl border border-slate-200":"fixed right-0 inset-y-0 bg-white w-[300px] rounded-l-3xl border border-slate-200",u=e.jsx("div",{className:"flex justify-center pt-3 pb-2","data-testid":"drag-handle",children:e.jsx("div",{className:"h-1 w-12 rounded-full bg-slate-300"})});return e.jsxs(o,{dismissalDirection:s,children:[e.jsx(i,{children:"Open Drawer"}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(m.Content,{className:x,children:[u,e.jsxs("div",{className:"px-6 py-4",children:[e.jsxs(r,{children:[s.charAt(0).toUpperCase()+s.slice(1)," Drawer"]}),e.jsxs(a,{children:["Swipe ",s," to close."]}),e.jsx(p,{children:"Close"})]})]})]})]})}const D={render:()=>e.jsx("div",{className:"h-screen bg-slate-50 p-6",children:e.jsx(_,{direction:"down"})})},N={render:()=>e.jsx("div",{className:"h-screen bg-slate-50 p-6",children:e.jsx(_,{direction:"up"})})},w={render:()=>e.jsx("div",{className:"h-screen bg-slate-50 p-6",children:e.jsx(_,{direction:"left"})})},y={render:()=>e.jsx("div",{className:"h-screen bg-slate-50 p-6",children:e.jsx(_,{direction:"right"})})},f={render:()=>e.jsx("div",{className:"h-screen bg-slate-50 p-6",children:e.jsxs(o,{disableDragDismiss:!0,children:[e.jsx(i,{children:"Open Drawer"}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(c,{children:[e.jsx(d,{}),e.jsxs("div",{className:"space-y-4 px-6 pb-6",children:[e.jsx(r,{children:"Persistent Drawer"}),e.jsx(a,{children:"Swiping shows a rubber-band effect but will not close the drawer. Use the close button, ESC, or click outside to dismiss."}),e.jsx(p,{children:"Close"})]})]})]})]})})},C={render:()=>{const s=[.2,.5,1];return e.jsx("div",{className:"h-screen bg-slate-50 p-6",children:e.jsxs(o,{snapPoints:s,children:[e.jsx(i,{children:"Open Drawer"}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(c,{children:[e.jsx(d,{}),e.jsxs("div",{className:"space-y-4 px-6 pb-6",children:[e.jsx(r,{children:"Three Snap Points"}),e.jsx(a,{children:"Snap points at 25 %, 50 %, and 100 %. Drag slowly to snap to the nearest point, or flick quickly to jump further."}),e.jsx(p,{children:"Close"})]})]})]})]})})}},S={render:()=>e.jsx("div",{className:"min-h-screen bg-slate-50 p-6",children:e.jsxs(o,{snapPoints:[.25,.5,1],defaultSnapPoint:1,children:[e.jsx(i,{children:"Open Drawer"}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(c,{children:[e.jsx(d,{}),e.jsxs("div",{className:"space-y-4 px-6 pb-6",children:[e.jsx(r,{children:"Default Snap Point at 50 %"}),e.jsx(a,{children:"Opens to the middle snap point (50 %) instead of the highest."}),e.jsx(p,{children:"Close"})]})]})]})]})})},P={render:()=>{const[s,n]=I.useState(2),x=[.5,.75,1];return e.jsx("div",{className:"min-h-screen bg-slate-50 p-6",children:e.jsxs(o,{snapPoints:x,snapPoint:s,onSnapPointChange:n,children:[e.jsxs("div",{className:"space-y-4",children:[e.jsxs("p",{className:"text-sm text-slate-600",children:["Active Snap Index: ",s]}),e.jsxs("p",{className:"text-sm text-slate-600",children:["Active Snap Ratio: ",x[s]*100,"%"]}),e.jsx(i,{children:"Open Drawer"})]}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(c,{children:[e.jsx(d,{}),e.jsxs("div",{className:"space-y-4 px-6 pb-6",children:[e.jsx(r,{children:"Controlled Snap Points"}),e.jsx(a,{children:"Use buttons below to change snap point programmatically, or drag to change."}),e.jsx("div",{className:"flex gap-2",children:x.map((u,h)=>e.jsxs("button",{onClick:()=>n(h),className:`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${s===h?"border-slate-900 bg-slate-900 text-white":"border-slate-300 text-slate-700 hover:bg-slate-100"}`,children:[u*100,"%"]},h))}),e.jsx(p,{children:"Close"})]})]})]})]})})}},T={render:()=>e.jsx("div",{className:"h-screen bg-slate-50 p-6",children:e.jsxs(o,{snapPoints:[.6],children:[e.jsx(i,{children:"Open Drawer"}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(c,{children:[e.jsx(d,{}),e.jsxs("div",{className:"space-y-4 px-6 pb-6",children:[e.jsx(r,{children:"Single Snap Point (60 %)"}),e.jsx(a,{children:"Toggles between closed and 60 % height."}),e.jsx(p,{children:"Close"})]})]})]})]})})},O={render:()=>{const[s,n]=I.useState(1),x=[.5,1];return e.jsx("div",{className:"h-screen bg-slate-50 p-6",children:e.jsxs(o,{disableDragDismiss:!0,snapPoints:x,snapPoint:s,onSnapPointChange:n,children:[e.jsx(i,{children:"Open Drawer"}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(c,{children:[e.jsx(d,{}),e.jsxs("div",{className:"space-y-4 px-6 pb-6",children:[e.jsx(r,{children:"Snap Points + Dismiss Disabled"}),e.jsx(a,{children:"Snap points at 30 %, 60 %, 100 %. Dragging below 30 % shows rubber-band but won't close. Use Close button, ESC, or overlay."}),e.jsx("div",{className:"flex gap-2",children:x.map((u,h)=>e.jsxs("button",{onClick:()=>n(h),className:`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${s===h?"border-slate-900 bg-slate-900 text-white":"border-slate-300 text-slate-700 hover:bg-slate-100"}`,children:[u*100,"%"]},h))}),e.jsx(p,{children:"Close"})]})]})]})]})})}},R={render:()=>e.jsx("div",{className:"h-screen bg-slate-50 p-6",children:e.jsxs(o,{children:[e.jsx(i,{children:"Open Drawer"}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(c,{children:[e.jsx(d,{}),e.jsxs("div",{className:"space-y-4 px-6 pb-6 h-full overflow-y-auto","data-testid":"scrollable-content",children:[e.jsx(r,{children:"Scrollable Content"}),e.jsx(a,{children:"When scrolled to the top, dragging down dismisses the drawer. When scrolled past the top, scroll takes priority over drag."}),e.jsx("div",{className:"space-y-3",children:Array.from({length:30},(s,n)=>e.jsxs("div",{className:"rounded-lg border border-slate-200 bg-slate-50 p-4",children:[e.jsxs("h3",{className:"font-medium",children:["Item ",n+1]}),e.jsx("p",{className:"text-sm text-slate-600",children:"Scroll to see more items. Try dragging from the top vs after scrolling."})]},n))})]})]})]})]})})},k={render:()=>e.jsx("div",{className:"h-screen w-full bg-slate-50 p-6",children:e.jsxs(o,{children:[e.jsx(i,{children:"Open Drawer"}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(c,{children:[e.jsx(d,{}),e.jsxs("div",{className:"space-y-6 px-6 pb-6",children:[e.jsx(r,{children:"No-Drag Zones"}),e.jsxs(a,{children:["The square below has"," ",e.jsx("code",{className:"rounded bg-slate-100 px-1 text-xs",children:"data-drawer-no-drag"})," ","attribute which disables drag interactions, allowing you to interact with it without accidentally dragging the drawer. This is useful for interactive elements like maps, sliders, etc."]}),e.jsx("div",{"data-drawer-no-drag":!0,"data-testid":"no-drag",className:"size-24 bg-amber-400"}),e.jsx(p,{children:"Close"})]})]})]})]})})},E={render:()=>e.jsx("div",{className:"h-screen w-full bg-slate-50 p-6",children:e.jsxs(o,{children:[e.jsx(i,{children:"Open Drawer"}),e.jsxs(l,{children:[e.jsx(t,{}),e.jsxs(c,{children:[e.jsx(d,{}),e.jsxs("div",{className:"space-y-4 px-6 pb-6 h-full overflow-y-auto",children:[e.jsx(r,{children:"Form Elements"}),e.jsx(a,{children:"Interacting with form controls should not start a drag."}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-slate-700 mb-1",children:"Text input"}),e.jsx("input",{type:"text",placeholder:"Type here…","data-testid":"text-input",className:"w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-slate-700 mb-1",children:"Textarea"}),e.jsx("textarea",{rows:3,placeholder:"Type here…","data-testid":"textarea",className:"w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-slate-700 mb-1",children:"Select"}),e.jsxs("select",{"data-testid":"select",className:"w-full rounded-lg border border-slate-300 px-3 py-2 text-sm",children:[e.jsx("option",{children:"Option A"}),e.jsx("option",{children:"Option B"}),e.jsx("option",{children:"Option C"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-slate-700 mb-1",children:"Content Editable"}),e.jsx("div",{contentEditable:!0,"data-testid":"content-editable",className:"w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-10"})]})]}),e.jsx(p,{children:"Close"})]})]})]})]})})};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => {
    return <div className='h-screen w-full bg-slate-50 p-6'>
        <Root>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Basic Drawer</Title>
                <Description>
                  Drag down to close, or click outside / press ESC.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>;
  }
}`,...g.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => {
    return <div className='h-screen w-full bg-slate-50 p-6'>
        <Root defaultOpen>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Basic Drawer</Title>
                <Description>
                  Drag down to close, or click outside / press ESC.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>;
  }
}`,...b.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = useState(false);
    return <div className='h-screen w-full bg-slate-50 p-6'>
        <Root open={open} onOpenChange={setOpen}>
          <button type='button' className={triggerClassName} onClick={() => setOpen(true)}>
            Open Drawer
          </button>
          <p className='text-sm text-slate-600' data-testid='state'>
            State: <strong>{open ? 'Open' : 'Closed'}</strong>
          </p>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Basic Drawer</Title>
                <Description>
                  Drag down to close, or click outside / press ESC.
                </Description>
                <button type='button' className={closeButtonClassName} onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>;
  }
}`,...j.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = useState(true);
    return <div className='h-screen w-full bg-slate-50 p-6'>
        <Root open={open} onOpenChange={setOpen}>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Basic Drawer</Title>
                <Description>
                  Drag down to close, or click outside / press ESC.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>;
  }
}`,...v.parameters?.docs?.source}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: () => <div className='h-screen bg-slate-50 p-6'>
      <DirectionStory direction='down' />
    </div>
}`,...D.parameters?.docs?.source}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  render: () => <div className='h-screen bg-slate-50 p-6'>
      <DirectionStory direction='up' />
    </div>
}`,...N.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <div className='h-screen bg-slate-50 p-6'>
      <DirectionStory direction='left' />
    </div>
}`,...w.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => <div className='h-screen bg-slate-50 p-6'>
      <DirectionStory direction='right' />
    </div>
}`,...y.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => {
    return <div className='h-screen bg-slate-50 p-6'>
        <Root disableDragDismiss>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Persistent Drawer</Title>
                <Description>
                  Swiping shows a rubber-band effect but will not close the
                  drawer. Use the close button, ESC, or click outside to
                  dismiss.
                </Description>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>;
  }
}`,...f.parameters?.docs?.source}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
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
}`,...S.parameters?.docs?.source}}};P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
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
}`,...P.parameters?.docs?.source}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source}}};O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
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
}`,...O.parameters?.docs?.source}}};R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  render: () => {
    return <div className='h-screen bg-slate-50 p-6'>
        <Root>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6 h-full overflow-y-auto' data-testid='scrollable-content'>
                <Title>Scrollable Content</Title>
                <Description>
                  When scrolled to the top, dragging down dismisses the drawer.
                  When scrolled past the top, scroll takes priority over drag.
                </Description>
                <div className='space-y-3'>
                  {Array.from({
                  length: 30
                }, (_, i) => <div key={i} className='rounded-lg border border-slate-200 bg-slate-50 p-4'>
                      <h3 className='font-medium'>Item {i + 1}</h3>
                      <p className='text-sm text-slate-600'>
                        Scroll to see more items. Try dragging from the top vs
                        after scrolling.
                      </p>
                    </div>)}
                </div>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>;
  }
}`,...R.parameters?.docs?.source}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  render: () => {
    return <div className='h-screen w-full bg-slate-50 p-6'>
        <Root>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-6 px-6 pb-6'>
                <Title>No-Drag Zones</Title>
                <Description>
                  The square below has{' '}
                  <code className='rounded bg-slate-100 px-1 text-xs'>
                    data-drawer-no-drag
                  </code>{' '}
                  attribute which disables drag interactions, allowing you to
                  interact with it without accidentally dragging the drawer.
                  This is useful for interactive elements like maps, sliders,
                  etc.
                </Description>
                <div data-drawer-no-drag data-testid='no-drag' className='size-24 bg-amber-400' />
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>;
  }
}`,...k.parameters?.docs?.source}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: () => {
    return <div className='h-screen w-full bg-slate-50 p-6'>
        <Root>
          <Trigger>Open Drawer</Trigger>
          <Portal>
            <Overlay />
            <Content>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6 h-full overflow-y-auto'>
                <Title>Form Elements</Title>
                <Description>
                  Interacting with form controls should not start a drag.
                </Description>
                <div className='space-y-3'>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1'>
                      Text input
                    </label>
                    <input type='text' placeholder='Type here…' data-testid='text-input' className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm' />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1'>
                      Textarea
                    </label>
                    <textarea rows={3} placeholder='Type here…' data-testid='textarea' className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm' />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1'>
                      Select
                    </label>
                    <select data-testid='select' className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'>
                      <option>Option A</option>
                      <option>Option B</option>
                      <option>Option C</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-1'>
                      Content Editable
                    </label>
                    <div contentEditable data-testid='content-editable' className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-10' />
                  </div>
                </div>
                <Close>Close</Close>
              </div>
            </Content>
          </Portal>
        </Root>
      </div>;
  }
}`,...E.parameters?.docs?.source}}};const G=["Default","InitiallyOpenWithUncontrolled","Controlled","InitiallyOpenWithControlled","DirectionDown","DirectionUp","DirectionLeft","DirectionRight","DisableDragDismiss","SnapPoints","SnapPointsWithDefaultIndex","ControlledSnapPoints","SingleSnapPoint","SnapPointsWithDisableDragDismiss","ScrollableContent","NoDragZone","FormElements"];export{j as Controlled,P as ControlledSnapPoints,g as Default,D as DirectionDown,w as DirectionLeft,y as DirectionRight,N as DirectionUp,f as DisableDragDismiss,E as FormElements,v as InitiallyOpenWithControlled,b as InitiallyOpenWithUncontrolled,k as NoDragZone,R as ScrollableContent,T as SingleSnapPoint,C as SnapPoints,S as SnapPointsWithDefaultIndex,O as SnapPointsWithDisableDragDismiss,G as __namedExportsOrder,L as default};
