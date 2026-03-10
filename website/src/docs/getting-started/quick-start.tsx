import { Drawer } from '@hikidas/react/radix-ui'
import React from 'react'
import './drawer.css'

export function DrawerDemo() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className='button trigger'>Open</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className='overlay' />
        <Drawer.Content className='container'>
          <Drawer.Close className='button close'>Close</Drawer.Close>
          <Drawer.Title className='title'>Headline</Drawer.Title>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
