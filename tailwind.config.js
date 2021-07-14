const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

module.exports = {
  purge: ['./src/**/*.{html,ts}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: 'var(--color-primary)',
        low: 'var(--color-low)',
        medium: 'var(--color-medium)',
        high: 'var(--color-high)',
        'light-blue': colors.lightBlue,
        cyan: colors.cyan,
        sidebar: 'var(--color-sidebar)',

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
      },
      boxShadow: ['active'],
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
