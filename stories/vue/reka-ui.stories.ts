import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Default from './Default.vue'
import Nested from './Nested.vue'
import SnapPoints from './SnapPoints.vue'

export default {
  title: 'Adapters/Reka UI',
  tags: ['test'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

type Story = StoryObj

// Smoke test — verifies the Reka UI adapter renders and basic open/close works
export const DefaultStory: Story = {
  name: 'Default',
  render: () => ({
    components: { Default },
    template: '<Default />',
  }),
}

// Smoke test — verifies snap points work through the Reka UI adapter
export const SnapPointsStory: Story = {
  name: 'Snap Points',
  render: () => ({
    components: { SnapPoints },
    template: '<SnapPoints />',
  }),
}

// Smoke test — verifies nested drawers work through the Reka UI adapter
export const NestedStory: Story = {
  name: 'Nested',
  render: () => ({
    components: { Nested },
    template: '<Nested />',
  }),
}
