const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  purge: {
    content: ['./src/**/*.{html,ts}', './tailwind.safelist.txt'],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      boxShadow: ['active'],
      colors: {
        primary: 'var(--color-primary)',
        low: 'var(--color-low)',
        medium: 'var(--color-medium)',
        high: 'var(--color-high)',
        cyan: colors.cyan,
        sidebar: 'var(--color-sidebar)',
        footer: 'var(--color-6)',

        // CHOOSE COLORS
        color1: 'var(--color-1)',
        color2: 'var(--color-2)',
        color3: 'var(--color-3)',
        color4: 'var(--color-4)',
        color5: 'var(--color-5)',

        'noah-pink': {
          low: '#FDACB2',
          medium: '#FA5F96',
          high: '#C21D7D',
        },
        'noah-red': {
          low: '#F2C94C',
          medium: '#F2994A',
          high: '#EB5757',
          unavailable: '#8B8B8B',
        },
        'noah-violet': {
          low: '#A9C6DE',
          medium: '#818ABC',
          high: '#804B9B',
        },
        'noah-blue': {
          low: '#B4D1E2',
          medium: '#5FA3CE',
          high: '#2B75B2',
        },
        'noah-green': {
          low: '#B7E392',
          medium: '#66BF71',
          high: '#1A994E',
        },
        'noah-black': {
          low: '#DADBDB',
          medium: '#8B8B8B',
          high: '#333333',
        },
        'age-agre': {
          elderly: '#146c94',
          youth: '#faa74b',
          children: '#c95c92',
          repro: '#63269f',
          women: '#fa2bb2',
          men: '#1ad3ff',
        },
      },
      fontFamily: {
        sans: ['Nunito', ...defaultTheme.fontFamily.sans],
      },
      width: {
        120: '26.5625rem',
        136: '37.5rem',
      },
    },
    listStyleType: {
      none: 'none',
      disc: 'disc',
      decimal: 'decimal',
      alpha: 'lower-alpha',
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
