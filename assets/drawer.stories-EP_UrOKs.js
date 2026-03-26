import{a as e,n as t}from"./chunk-BneVvdWh.js";import{a as n}from"./iframe-BzOlYhL9.js";import{t as r}from"./jsx-runtime-6sF1Ejqi.js";import{n as i}from"./radix-ui-DqLKmjYN.js";import{a,c as o,d as s,f as c,i as l,l as u,n as d,o as f,r as p,s as m,t as h,u as g}from"./drawer-CUL4UbpL.js";function _({direction:e}){let t=e===`down`||e===`up`?e===`down`?`fixed bottom-0 inset-x-0 bg-white h-[40vh] rounded-t-3xl border border-slate-200`:`fixed top-0 inset-x-0 bg-white h-[40vh] rounded-b-3xl border border-slate-200`:e===`left`?`fixed left-0 inset-y-0 bg-white w-[300px] rounded-r-3xl border border-slate-200`:`fixed right-0 inset-y-0 bg-white w-[300px] rounded-l-3xl border border-slate-200`,n=(0,y.jsx)(`div`,{className:`flex justify-center pt-3 pb-2`,"data-testid":`drag-handle`,children:(0,y.jsx)(`div`,{className:`h-1 w-12 rounded-full bg-slate-300`})});return(0,y.jsxs)(m,{dismissalDirection:e,children:[(0,y.jsx)(u,{children:`Open Drawer`}),(0,y.jsxs)(f,{children:[(0,y.jsx)(a,{}),(0,y.jsxs)(i.Content,{className:t,children:[n,(0,y.jsxs)(`div`,{className:`px-6 py-4`,children:[(0,y.jsxs)(o,{children:[e.charAt(0).toUpperCase()+e.slice(1),` Drawer`]}),(0,y.jsxs)(p,{children:[`Swipe `,e,` to close.`]}),(0,y.jsx)(h,{children:`Close`})]})]})]})]})}var v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N;t((()=>{v=e(n()),s(),y=r(),b={title:`Drawer`,tags:[`test`],parameters:{layout:`fullscreen`}},x={render:()=>(0,y.jsx)(`div`,{className:`h-screen w-full bg-slate-50 p-6`,children:(0,y.jsxs)(m,{children:[(0,y.jsx)(u,{children:`Open Drawer`}),(0,y.jsxs)(f,{children:[(0,y.jsx)(a,{}),(0,y.jsxs)(d,{children:[(0,y.jsx)(l,{}),(0,y.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,y.jsx)(o,{children:`Basic Drawer`}),(0,y.jsx)(p,{children:`Drag down to close, or click outside / press ESC.`}),(0,y.jsx)(h,{children:`Close`})]})]})]})]})})},S={render:()=>(0,y.jsx)(`div`,{className:`h-screen w-full bg-slate-50 p-6`,children:(0,y.jsxs)(m,{defaultOpen:!0,children:[(0,y.jsx)(u,{children:`Open Drawer`}),(0,y.jsxs)(f,{children:[(0,y.jsx)(a,{}),(0,y.jsxs)(d,{children:[(0,y.jsx)(l,{}),(0,y.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,y.jsx)(o,{children:`Basic Drawer`}),(0,y.jsx)(p,{children:`Drag down to close, or click outside / press ESC.`}),(0,y.jsx)(h,{children:`Close`})]})]})]})]})})},C={render:()=>{let[e,t]=(0,v.useState)(!1);return(0,y.jsx)(`div`,{className:`h-screen w-full bg-slate-50 p-6`,children:(0,y.jsxs)(m,{open:e,onOpenChange:t,children:[(0,y.jsx)(`button`,{type:`button`,className:c,onClick:()=>t(!0),children:`Open Drawer`}),(0,y.jsxs)(`p`,{className:`text-sm text-slate-600`,"data-testid":`state`,children:[`State: `,(0,y.jsx)(`strong`,{children:e?`Open`:`Closed`})]}),(0,y.jsxs)(f,{children:[(0,y.jsx)(a,{}),(0,y.jsxs)(d,{children:[(0,y.jsx)(l,{}),(0,y.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,y.jsx)(o,{children:`Basic Drawer`}),(0,y.jsx)(p,{children:`Drag down to close, or click outside / press ESC.`}),(0,y.jsx)(`button`,{type:`button`,className:g,onClick:()=>t(!1),children:`Close`})]})]})]})]})})}},w={render:()=>{let[e,t]=(0,v.useState)(!0);return(0,y.jsx)(`div`,{className:`h-screen w-full bg-slate-50 p-6`,children:(0,y.jsxs)(m,{open:e,onOpenChange:t,children:[(0,y.jsx)(u,{children:`Open Drawer`}),(0,y.jsxs)(f,{children:[(0,y.jsx)(a,{}),(0,y.jsxs)(d,{children:[(0,y.jsx)(l,{}),(0,y.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,y.jsx)(o,{children:`Basic Drawer`}),(0,y.jsx)(p,{children:`Drag down to close, or click outside / press ESC.`}),(0,y.jsx)(h,{children:`Close`})]})]})]})]})})}},T={render:()=>(0,y.jsx)(`div`,{className:`h-screen bg-slate-50 p-6`,children:(0,y.jsx)(_,{direction:`down`})})},E={render:()=>(0,y.jsx)(`div`,{className:`h-screen bg-slate-50 p-6`,children:(0,y.jsx)(_,{direction:`up`})})},D={render:()=>(0,y.jsx)(`div`,{className:`h-screen bg-slate-50 p-6`,children:(0,y.jsx)(_,{direction:`left`})})},O={render:()=>(0,y.jsx)(`div`,{className:`h-screen bg-slate-50 p-6`,children:(0,y.jsx)(_,{direction:`right`})})},k={render:()=>(0,y.jsx)(`div`,{className:`h-screen bg-slate-50 p-6`,children:(0,y.jsxs)(m,{disableDragDismiss:!0,children:[(0,y.jsx)(u,{children:`Open Drawer`}),(0,y.jsxs)(f,{children:[(0,y.jsx)(a,{}),(0,y.jsxs)(d,{children:[(0,y.jsx)(l,{}),(0,y.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,y.jsx)(o,{children:`Persistent Drawer`}),(0,y.jsx)(p,{children:`Swiping shows a rubber-band effect but will not close the drawer. Use the close button, ESC, or click outside to dismiss.`}),(0,y.jsx)(h,{children:`Close`})]})]})]})]})})},A={render:()=>(0,y.jsx)(`div`,{className:`h-screen bg-slate-50 p-6`,children:(0,y.jsxs)(m,{children:[(0,y.jsx)(u,{children:`Open Drawer`}),(0,y.jsxs)(f,{children:[(0,y.jsx)(a,{}),(0,y.jsxs)(d,{children:[(0,y.jsx)(l,{}),(0,y.jsxs)(`div`,{className:`space-y-4 px-6 pb-6 h-full overflow-y-auto`,"data-testid":`scrollable-content`,children:[(0,y.jsx)(o,{children:`Scrollable Content`}),(0,y.jsx)(p,{children:`When scrolled to the top, dragging down dismisses the drawer. When scrolled past the top, scroll takes priority over drag.`}),(0,y.jsx)(`div`,{className:`space-y-3`,children:Array.from({length:30},(e,t)=>(0,y.jsxs)(`div`,{className:`rounded-lg border border-slate-200 bg-slate-50 p-4`,children:[(0,y.jsxs)(`h3`,{className:`font-medium`,children:[`Item `,t+1]}),(0,y.jsx)(`p`,{className:`text-sm text-slate-600`,children:`Scroll to see more items. Try dragging from the top vs after scrolling.`})]},t))})]})]})]})]})})},j={render:()=>(0,y.jsx)(`div`,{className:`h-screen w-full bg-slate-50 p-6`,children:(0,y.jsxs)(m,{children:[(0,y.jsx)(u,{children:`Open Drawer`}),(0,y.jsxs)(f,{children:[(0,y.jsx)(a,{}),(0,y.jsxs)(d,{children:[(0,y.jsx)(l,{}),(0,y.jsxs)(`div`,{className:`space-y-6 px-6 pb-6`,children:[(0,y.jsx)(o,{children:`No-Drag Zones`}),(0,y.jsxs)(p,{children:[`The square below has`,` `,(0,y.jsx)(`code`,{className:`rounded bg-slate-100 px-1 text-xs`,children:`data-drawer-no-drag`}),` `,`attribute which disables drag interactions, allowing you to interact with it without accidentally dragging the drawer. This is useful for interactive elements like maps, sliders, etc.`]}),(0,y.jsx)(`div`,{"data-drawer-no-drag":!0,"data-testid":`no-drag`,className:`size-24 bg-amber-400`}),(0,y.jsx)(h,{children:`Close`})]})]})]})]})})},M={render:()=>(0,y.jsx)(`div`,{className:`h-screen w-full bg-slate-50 p-6`,children:(0,y.jsxs)(m,{children:[(0,y.jsx)(u,{children:`Open Drawer`}),(0,y.jsxs)(f,{children:[(0,y.jsx)(a,{}),(0,y.jsxs)(d,{children:[(0,y.jsx)(l,{}),(0,y.jsxs)(`div`,{className:`space-y-4 px-6 pb-6 h-full overflow-y-auto`,children:[(0,y.jsx)(o,{children:`Form Elements`}),(0,y.jsx)(p,{children:`Interacting with form controls should not start a drag.`}),(0,y.jsxs)(`div`,{className:`space-y-3`,children:[(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`label`,{className:`block text-sm font-medium text-slate-700 mb-1`,children:`Text input`}),(0,y.jsx)(`input`,{type:`text`,placeholder:`Type here…`,"data-testid":`text-input`,className:`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm`})]}),(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`label`,{className:`block text-sm font-medium text-slate-700 mb-1`,children:`Textarea`}),(0,y.jsx)(`textarea`,{rows:3,placeholder:`Type here…`,"data-testid":`textarea`,className:`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm`})]}),(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`label`,{className:`block text-sm font-medium text-slate-700 mb-1`,children:`Select`}),(0,y.jsxs)(`select`,{"data-testid":`select`,className:`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm`,children:[(0,y.jsx)(`option`,{children:`Option A`}),(0,y.jsx)(`option`,{children:`Option B`}),(0,y.jsx)(`option`,{children:`Option C`})]})]}),(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`label`,{className:`block text-sm font-medium text-slate-700 mb-1`,children:`Content Editable`}),(0,y.jsx)(`div`,{contentEditable:!0,"data-testid":`content-editable`,className:`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-10`})]})]}),(0,y.jsx)(h,{children:`Close`})]})]})]})]})})},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
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
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
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
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
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
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => <div className='h-screen bg-slate-50 p-6'>
      <DirectionStory direction='down' />
    </div>
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: () => <div className='h-screen bg-slate-50 p-6'>
      <DirectionStory direction='up' />
    </div>
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: () => <div className='h-screen bg-slate-50 p-6'>
      <DirectionStory direction='left' />
    </div>
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  render: () => <div className='h-screen bg-slate-50 p-6'>
      <DirectionStory direction='right' />
    </div>
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
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
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
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
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
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
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
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
}`,...M.parameters?.docs?.source}}},N=[`Default`,`InitiallyOpenWithUncontrolled`,`Controlled`,`InitiallyOpenWithControlled`,`DirectionDown`,`DirectionUp`,`DirectionLeft`,`DirectionRight`,`DisableDragDismiss`,`ScrollableContent`,`NoDragZone`,`FormElements`]}))();export{C as Controlled,x as Default,T as DirectionDown,D as DirectionLeft,O as DirectionRight,E as DirectionUp,k as DisableDragDismiss,M as FormElements,w as InitiallyOpenWithControlled,S as InitiallyOpenWithUncontrolled,j as NoDragZone,A as ScrollableContent,N as __namedExportsOrder,b as default};