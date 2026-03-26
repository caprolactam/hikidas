import{a as e,n as t}from"./chunk-BneVvdWh.js";import{a as n}from"./iframe-1WKkNprc.js";import{t as r}from"./jsx-runtime-6sF1Ejqi.js";import{n as i,t as a}from"./index.prod-D7zd-TXh.js";import{a as o,c as s,d as c,f as l,i as u,r as d,u as f}from"./drawer-BAb7jBob.js";function p({children:e,level:t=0}){return(0,h.jsx)(a.Content,{className:`fixed bottom-0 inset-x-0 bg-white ${[`h-[75vh]`,`h-[65vh]`,`h-[55vh]`][t]??`h-[50vh]`} rounded-t-3xl border border-slate-200 after:absolute after:inset-0 after:rounded-[inherit] after:bg-transparent after:pointer-events-none after:transition-[background-color] after:duration-200 after:ease-[cubic-bezier(0.32,0.72,0,1)] data-nested-drawer-open:after:bg-black/5`,children:e})}var m,h,g,_,v,y,b,x,S;t((()=>{m=e(n()),c(),h=r(),g={title:`Drawer/Nested`,parameters:{layout:`fullscreen`}},_={name:`Deep Nesting (3 levels)`,render:()=>(0,h.jsx)(`div`,{className:`h-screen w-full bg-slate-50 p-6`,children:(0,h.jsx)(i,{children:(0,h.jsxs)(a.Root,{children:[(0,h.jsx)(a.Trigger,{className:l,children:`Open Level 1`}),(0,h.jsxs)(a.Portal,{children:[(0,h.jsx)(o,{}),(0,h.jsxs)(p,{level:0,children:[(0,h.jsx)(u,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(s,{children:`Level 1`}),(0,h.jsx)(d,{children:`Deepest nesting: this will scale down twice (scale = 0.90) when all children are open.`}),(0,h.jsxs)(a.Root,{children:[(0,h.jsx)(a.Trigger,{className:l,children:`Open Level 2`}),(0,h.jsx)(a.Portal,{children:(0,h.jsxs)(p,{level:1,children:[(0,h.jsx)(u,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(s,{children:`Level 2`}),(0,h.jsx)(d,{children:`This will scale down once (scale = 0.95) when the grandchild opens.`}),(0,h.jsxs)(a.Root,{children:[(0,h.jsx)(a.Trigger,{className:l,children:`Open Level 3`}),(0,h.jsx)(a.Portal,{children:(0,h.jsxs)(p,{level:2,children:[(0,h.jsx)(u,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(s,{children:`Level 3`}),(0,h.jsx)(d,{children:`The deepest drawer. Close this to see the parents scale back up one by one.`}),(0,h.jsx)(a.Close,{className:f,children:`Close Level 3`})]})]})})]}),(0,h.jsx)(a.Close,{className:f,children:`Close Level 2`})]})]})})]}),(0,h.jsx)(a.Close,{className:f,children:`Close Level 1`})]})]})]})]})})})},v={name:`Without NestingDrawerProvider`,render:()=>(0,h.jsxs)(`div`,{className:`h-screen w-full bg-slate-50 p-6`,children:[(0,h.jsx)(`p`,{className:`mb-4 text-sm text-slate-500`,children:`No NestingDrawerProvider — nesting animation is disabled. Drawers work independently.`}),(0,h.jsxs)(a.Root,{children:[(0,h.jsx)(a.Trigger,{className:l,children:`Open Parent Drawer`}),(0,h.jsxs)(a.Portal,{children:[(0,h.jsx)(o,{}),(0,h.jsxs)(p,{level:0,children:[(0,h.jsx)(u,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(s,{children:`Parent Drawer`}),(0,h.jsx)(d,{children:`No scale animation will occur when the child opens.`}),(0,h.jsxs)(a.Root,{children:[(0,h.jsx)(a.Trigger,{className:l,children:`Open Child Drawer`}),(0,h.jsx)(a.Portal,{children:(0,h.jsxs)(p,{level:1,children:[(0,h.jsx)(u,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(s,{children:`Child Drawer`}),(0,h.jsx)(d,{children:`Parent should NOT scale — no registry is present.`}),(0,h.jsx)(a.Close,{className:f,children:`Close Child`})]})]})})]}),(0,h.jsx)(a.Close,{className:f,children:`Close Parent`})]})]})]})]})]})},y={name:`Both Initially Open (defaultOpen)`,render:()=>(0,h.jsx)(`div`,{className:`h-screen w-full bg-slate-50 p-6`,children:(0,h.jsx)(i,{children:(0,h.jsxs)(a.Root,{defaultOpen:!0,children:[(0,h.jsx)(a.Trigger,{className:l,children:`Open Parent Drawer`}),(0,h.jsxs)(a.Portal,{children:[(0,h.jsx)(o,{}),(0,h.jsxs)(p,{level:0,children:[(0,h.jsx)(u,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(s,{children:`Parent Drawer`}),(0,h.jsxs)(d,{children:[`Both parent and child are initially open. The parent should already be scaled down on mount — no flash.`,(0,h.jsx)(`br`,{}),(0,h.jsx)(`br`,{}),(0,h.jsx)(`strong`,{children:`Note:`})," After closing all drawers and reopening the parent, the child remounts with defaultOpen=true again. Use controlled `open` prop to preserve closed state across parent reopen cycles."]}),(0,h.jsxs)(a.Root,{defaultOpen:!0,children:[(0,h.jsx)(a.Trigger,{className:l,children:`Open Child Drawer`}),(0,h.jsx)(a.Portal,{children:(0,h.jsxs)(p,{level:1,children:[(0,h.jsx)(u,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(s,{children:`Child Drawer`}),(0,h.jsx)(d,{children:`Close this to see the parent animate back to full scale.`}),(0,h.jsx)(a.Close,{className:f,children:`Close Child`})]})]})})]}),(0,h.jsx)(a.Close,{className:f,children:`Close Parent`})]})]})]})]})})})},b={name:`Close Parent from Child`,render:()=>{let[e,t]=(0,m.useState)(!1),[n,r]=(0,m.useState)(!1);return(0,h.jsx)(`div`,{className:`h-screen w-full bg-slate-50 p-6 space-y-4`,children:(0,h.jsxs)(i,{children:[(0,h.jsxs)(`div`,{className:`flex gap-4 items-center`,children:[(0,h.jsx)(`button`,{type:`button`,className:l,onClick:()=>t(!0),children:`Open Parent`}),(0,h.jsxs)(`p`,{className:`text-sm text-slate-600`,children:[`Parent: `,(0,h.jsx)(`strong`,{children:e?`Open`:`Closed`}),` | Child:`,` `,(0,h.jsx)(`strong`,{children:n?`Open`:`Closed`})]})]}),(0,h.jsx)(a.Root,{open:e,onOpenChange:t,children:(0,h.jsxs)(a.Portal,{children:[(0,h.jsx)(o,{}),(0,h.jsxs)(p,{level:0,children:[(0,h.jsx)(u,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(s,{children:`Parent Drawer`}),(0,h.jsx)(d,{children:`Open the child drawer, then close the parent from within the child. Both drawers should animate their close transitions.`}),(0,h.jsxs)(a.Root,{open:n,onOpenChange:r,children:[(0,h.jsx)(`button`,{type:`button`,className:l,onClick:()=>r(!0),children:`Open Child`}),(0,h.jsx)(a.Portal,{children:(0,h.jsxs)(p,{level:1,children:[(0,h.jsx)(u,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(s,{children:`Child Drawer (Form)`}),(0,h.jsx)(d,{children:`Simulates a form completion flow. Clicking "Complete & Close Parent" closes the parent drawer, which propagates close to this child drawer as well.`}),(0,h.jsx)(`button`,{type:`button`,className:f,onClick:()=>r(!1),children:`Close Child Only`}),(0,h.jsx)(`button`,{type:`button`,className:`${f} bg-blue-600! text-white! hover:bg-blue-700!`,onClick:()=>t(!1),children:`Complete & Close Parent`})]})]})})]}),(0,h.jsx)(`button`,{type:`button`,className:f,onClick:()=>t(!1),children:`Close Parent`})]})]})]})})]})})}},x={name:`Sibling Drawers`,render:()=>(0,h.jsx)(`div`,{className:`h-screen w-full bg-slate-50 p-6`,children:(0,h.jsx)(i,{children:(0,h.jsxs)(a.Root,{children:[(0,h.jsx)(a.Trigger,{className:l,children:`Open Parent Drawer`}),(0,h.jsxs)(a.Portal,{children:[(0,h.jsx)(o,{}),(0,h.jsxs)(p,{level:0,children:[(0,h.jsx)(u,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(s,{children:`Parent Drawer`}),(0,h.jsx)(d,{children:`Two sibling child drawers share the same parent. Close one and open the other — the parent scale animation should transition correctly between siblings.`}),(0,h.jsxs)(`div`,{className:`flex gap-3`,children:[(0,h.jsxs)(a.Root,{children:[(0,h.jsx)(a.Trigger,{className:l,children:`Open Child A`}),(0,h.jsx)(a.Portal,{children:(0,h.jsxs)(p,{level:1,children:[(0,h.jsx)(u,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(s,{children:`Child A`}),(0,h.jsx)(d,{children:`Close this drawer, then open Child B from the parent.`}),(0,h.jsx)(a.Close,{className:f,children:`Close Child A`})]})]})})]}),(0,h.jsxs)(a.Root,{children:[(0,h.jsx)(a.Trigger,{className:l,children:`Open Child B`}),(0,h.jsx)(a.Portal,{children:(0,h.jsxs)(p,{level:1,children:[(0,h.jsx)(u,{}),(0,h.jsxs)(`div`,{className:`space-y-4 px-6 pb-6`,children:[(0,h.jsx)(s,{children:`Child B`}),(0,h.jsx)(d,{children:`Close this drawer, then open Child A from the parent.`}),(0,h.jsx)(a.Close,{className:f,children:`Close Child B`})]})]})})]})]}),(0,h.jsx)(a.Close,{className:f,children:`Close Parent`})]})]})]})]})})})},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: 'Deep Nesting (3 levels)',
  render: () => <div className='h-screen w-full bg-slate-50 p-6'>
      <NestingDrawerProvider>
        <Drawer.Root>
          <Drawer.Trigger className={triggerClassName}>
            Open Level 1
          </Drawer.Trigger>
          <Drawer.Portal>
            <Overlay />
            <NestedContent level={0}>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Level 1</Title>
                <Description>
                  Deepest nesting: this will scale down twice (scale = 0.90)
                  when all children are open.
                </Description>

                <Drawer.Root>
                  <Drawer.Trigger className={triggerClassName}>
                    Open Level 2
                  </Drawer.Trigger>
                  <Drawer.Portal>
                    <NestedContent level={1}>
                      <DummyHandle />
                      <div className='space-y-4 px-6 pb-6'>
                        <Title>Level 2</Title>
                        <Description>
                          This will scale down once (scale = 0.95) when the
                          grandchild opens.
                        </Description>

                        <Drawer.Root>
                          <Drawer.Trigger className={triggerClassName}>
                            Open Level 3
                          </Drawer.Trigger>
                          <Drawer.Portal>
                            <NestedContent level={2}>
                              <DummyHandle />
                              <div className='space-y-4 px-6 pb-6'>
                                <Title>Level 3</Title>
                                <Description>
                                  The deepest drawer. Close this to see the
                                  parents scale back up one by one.
                                </Description>
                                <Drawer.Close className={closeButtonClassName}>
                                  Close Level 3
                                </Drawer.Close>
                              </div>
                            </NestedContent>
                          </Drawer.Portal>
                        </Drawer.Root>

                        <Drawer.Close className={closeButtonClassName}>
                          Close Level 2
                        </Drawer.Close>
                      </div>
                    </NestedContent>
                  </Drawer.Portal>
                </Drawer.Root>

                <Drawer.Close className={closeButtonClassName}>
                  Close Level 1
                </Drawer.Close>
              </div>
            </NestedContent>
          </Drawer.Portal>
        </Drawer.Root>
      </NestingDrawerProvider>
    </div>
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: 'Without NestingDrawerProvider',
  render: () => <div className='h-screen w-full bg-slate-50 p-6'>
      <p className='mb-4 text-sm text-slate-500'>
        No NestingDrawerProvider — nesting animation is disabled. Drawers work
        independently.
      </p>
      <Drawer.Root>
        <Drawer.Trigger className={triggerClassName}>
          Open Parent Drawer
        </Drawer.Trigger>
        <Drawer.Portal>
          <Overlay />
          <NestedContent level={0}>
            <DummyHandle />
            <div className='space-y-4 px-6 pb-6'>
              <Title>Parent Drawer</Title>
              <Description>
                No scale animation will occur when the child opens.
              </Description>

              <Drawer.Root>
                <Drawer.Trigger className={triggerClassName}>
                  Open Child Drawer
                </Drawer.Trigger>
                <Drawer.Portal>
                  <NestedContent level={1}>
                    <DummyHandle />
                    <div className='space-y-4 px-6 pb-6'>
                      <Title>Child Drawer</Title>
                      <Description>
                        Parent should NOT scale — no registry is present.
                      </Description>
                      <Drawer.Close className={closeButtonClassName}>
                        Close Child
                      </Drawer.Close>
                    </div>
                  </NestedContent>
                </Drawer.Portal>
              </Drawer.Root>

              <Drawer.Close className={closeButtonClassName}>
                Close Parent
              </Drawer.Close>
            </div>
          </NestedContent>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: 'Both Initially Open (defaultOpen)',
  render: () => <div className='h-screen w-full bg-slate-50 p-6'>
      <NestingDrawerProvider>
        <Drawer.Root defaultOpen>
          <Drawer.Trigger className={triggerClassName}>
            Open Parent Drawer
          </Drawer.Trigger>
          <Drawer.Portal>
            <Overlay />
            <NestedContent level={0}>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Parent Drawer</Title>
                <Description>
                  Both parent and child are initially open. The parent should
                  already be scaled down on mount — no flash.
                  <br />
                  <br />
                  <strong>Note:</strong> After closing all drawers and reopening
                  the parent, the child remounts with defaultOpen=true again.
                  Use controlled \`open\` prop to preserve closed state across
                  parent reopen cycles.
                </Description>

                <Drawer.Root defaultOpen>
                  <Drawer.Trigger className={triggerClassName}>
                    Open Child Drawer
                  </Drawer.Trigger>
                  <Drawer.Portal>
                    <NestedContent level={1}>
                      <DummyHandle />
                      <div className='space-y-4 px-6 pb-6'>
                        <Title>Child Drawer</Title>
                        <Description>
                          Close this to see the parent animate back to full
                          scale.
                        </Description>
                        <Drawer.Close className={closeButtonClassName}>
                          Close Child
                        </Drawer.Close>
                      </div>
                    </NestedContent>
                  </Drawer.Portal>
                </Drawer.Root>

                <Drawer.Close className={closeButtonClassName}>
                  Close Parent
                </Drawer.Close>
              </div>
            </NestedContent>
          </Drawer.Portal>
        </Drawer.Root>
      </NestingDrawerProvider>
    </div>
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: 'Close Parent from Child',
  render: () => {
    const [parentOpen, setParentOpen] = useState(false);
    const [childOpen, setChildOpen] = useState(false);
    return <div className='h-screen w-full bg-slate-50 p-6 space-y-4'>
        <NestingDrawerProvider>
          <div className='flex gap-4 items-center'>
            <button type='button' className={triggerClassName} onClick={() => setParentOpen(true)}>
              Open Parent
            </button>
            <p className='text-sm text-slate-600'>
              Parent: <strong>{parentOpen ? 'Open' : 'Closed'}</strong> | Child:{' '}
              <strong>{childOpen ? 'Open' : 'Closed'}</strong>
            </p>
          </div>

          <Drawer.Root open={parentOpen} onOpenChange={setParentOpen}>
            <Drawer.Portal>
              <Overlay />
              <NestedContent level={0}>
                <DummyHandle />
                <div className='space-y-4 px-6 pb-6'>
                  <Title>Parent Drawer</Title>
                  <Description>
                    Open the child drawer, then close the parent from within the
                    child. Both drawers should animate their close transitions.
                  </Description>

                  <Drawer.Root open={childOpen} onOpenChange={setChildOpen}>
                    <button type='button' className={triggerClassName} onClick={() => setChildOpen(true)}>
                      Open Child
                    </button>
                    <Drawer.Portal>
                      <NestedContent level={1}>
                        <DummyHandle />
                        <div className='space-y-4 px-6 pb-6'>
                          <Title>Child Drawer (Form)</Title>
                          <Description>
                            Simulates a form completion flow. Clicking "Complete
                            & Close Parent" closes the parent drawer, which
                            propagates close to this child drawer as well.
                          </Description>
                          <button type='button' className={closeButtonClassName} onClick={() => setChildOpen(false)}>
                            Close Child Only
                          </button>
                          <button type='button' className={\`\${closeButtonClassName} bg-blue-600! text-white! hover:bg-blue-700!\`} onClick={() => setParentOpen(false)}>
                            Complete & Close Parent
                          </button>
                        </div>
                      </NestedContent>
                    </Drawer.Portal>
                  </Drawer.Root>

                  <button type='button' className={closeButtonClassName} onClick={() => setParentOpen(false)}>
                    Close Parent
                  </button>
                </div>
              </NestedContent>
            </Drawer.Portal>
          </Drawer.Root>
        </NestingDrawerProvider>
      </div>;
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: 'Sibling Drawers',
  render: () => <div className='h-screen w-full bg-slate-50 p-6'>
      <NestingDrawerProvider>
        <Drawer.Root>
          <Drawer.Trigger className={triggerClassName}>
            Open Parent Drawer
          </Drawer.Trigger>
          <Drawer.Portal>
            <Overlay />
            <NestedContent level={0}>
              <DummyHandle />
              <div className='space-y-4 px-6 pb-6'>
                <Title>Parent Drawer</Title>
                <Description>
                  Two sibling child drawers share the same parent. Close one and
                  open the other — the parent scale animation should transition
                  correctly between siblings.
                </Description>

                <div className='flex gap-3'>
                  <Drawer.Root>
                    <Drawer.Trigger className={triggerClassName}>
                      Open Child A
                    </Drawer.Trigger>
                    <Drawer.Portal>
                      <NestedContent level={1}>
                        <DummyHandle />
                        <div className='space-y-4 px-6 pb-6'>
                          <Title>Child A</Title>
                          <Description>
                            Close this drawer, then open Child B from the
                            parent.
                          </Description>
                          <Drawer.Close className={closeButtonClassName}>
                            Close Child A
                          </Drawer.Close>
                        </div>
                      </NestedContent>
                    </Drawer.Portal>
                  </Drawer.Root>

                  <Drawer.Root>
                    <Drawer.Trigger className={triggerClassName}>
                      Open Child B
                    </Drawer.Trigger>
                    <Drawer.Portal>
                      <NestedContent level={1}>
                        <DummyHandle />
                        <div className='space-y-4 px-6 pb-6'>
                          <Title>Child B</Title>
                          <Description>
                            Close this drawer, then open Child A from the
                            parent.
                          </Description>
                          <Drawer.Close className={closeButtonClassName}>
                            Close Child B
                          </Drawer.Close>
                        </div>
                      </NestedContent>
                    </Drawer.Portal>
                  </Drawer.Root>
                </div>

                <Drawer.Close className={closeButtonClassName}>
                  Close Parent
                </Drawer.Close>
              </div>
            </NestedContent>
          </Drawer.Portal>
        </Drawer.Root>
      </NestingDrawerProvider>
    </div>
}`,...x.parameters?.docs?.source}}},S=[`ThreeLevels`,`WithoutProvider`,`InitiallyOpen`,`CloseParentFromChild`,`Siblings`]}))();export{b as CloseParentFromChild,y as InitiallyOpen,x as Siblings,_ as ThreeLevels,v as WithoutProvider,S as __namedExportsOrder,g as default};