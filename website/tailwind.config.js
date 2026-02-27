/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            pre: {
              paddingInlineStart: '0',
              paddingInlineEnd: '0',
              border: '1px solid var(--color-brand-6)',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            table: {
              borderCollapse: 'separate',
              borderSpacing: '0',
              borderRadius: '0.5rem',
              overflow: 'hidden',
            },
            'th:first-child': {
              paddingInlineStart: '1rem',
              width: '37%',
            },
            'td:first-child': {
              paddingInlineStart: '1rem',
              width: '37%',
            },
          },
        },
      },
    },
  },
}
