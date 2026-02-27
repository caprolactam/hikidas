import{j as e}from"./jsx-runtime-u17CrQMm.js";import{r as n}from"./iframe-CU1OH3mJ.js";import{D as t}from"./drawer-CRoqalc2.js";import"./preload-helper-PPVm8Dsz.js";import"./drawer-adapter-xW1zTYYn.js";import"./use-static-b41ELNWf.js";import"./spring-Yoh8F8YA.js";import"./index-BX2HJR2s.js";import"./index-Bi-EWYOf.js";const b={title:"Adapters/Radix UI",tags:["test"],parameters:{layout:"fullscreen"}},r={render:()=>{const[s,a]=n.useState(!1);return e.jsx("div",{className:"min-h-screen bg-slate-50 p-6",children:e.jsxs(t.Root,{open:s,onOpenChange:a,children:[e.jsx(t.Trigger,{asChild:!0,children:e.jsx("button",{className:"inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800",children:"Open Drawer"})}),e.jsxs(t.Portal,{children:[e.jsx(t.Overlay,{className:"fixed inset-0 bg-black/50"}),e.jsxs(t.Content,{className:"fixed bottom-0 inset-x-0 bg-white h-75 rounded-t-3xl border border-slate-200",children:[e.jsx("div",{className:"flex justify-center pt-3 pb-2","data-testid":"drag-handle",children:e.jsx("div",{className:"h-1 w-12 rounded-full bg-slate-300"})}),e.jsxs("div",{className:"space-y-4 px-6 pb-6",children:[e.jsx(t.Title,{className:"text-lg font-semibold",children:"Radix UI Adapter"}),e.jsx(t.Description,{className:"text-sm leading-relaxed text-slate-600",children:"Smoke test for the Radix UI adapter. Open, drag, and close should all work correctly."}),e.jsx(t.Close,{asChild:!0,children:e.jsx("button",{className:"inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100",children:"Close"})})]})]})]})]})})}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = useState(false);
    return <div className='min-h-screen bg-slate-50 p-6'>
        <Drawer.Root open={open} onOpenChange={setOpen}>
          <Drawer.Trigger asChild>
            <button className='inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800'>
              Open Drawer
            </button>
          </Drawer.Trigger>

          <Drawer.Portal>
            <Drawer.Overlay className='fixed inset-0 bg-black/50' />
            <Drawer.Content className='fixed bottom-0 inset-x-0 bg-white h-75 rounded-t-3xl border border-slate-200'>
              <div className='flex justify-center pt-3 pb-2' data-testid='drag-handle'>
                <div className='h-1 w-12 rounded-full bg-slate-300' />
              </div>
              <div className='space-y-4 px-6 pb-6'>
                <Drawer.Title className='text-lg font-semibold'>
                  Radix UI Adapter
                </Drawer.Title>
                <Drawer.Description className='text-sm leading-relaxed text-slate-600'>
                  Smoke test for the Radix UI adapter. Open, drag, and close
                  should all work correctly.
                </Drawer.Description>
                <Drawer.Close asChild>
                  <button className='inline-flex w-full justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'>
                    Close
                  </button>
                </Drawer.Close>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>;
  }
}`,...r.parameters?.docs?.source}}};const h=["Default"];export{r as Default,h as __namedExportsOrder,b as default};
