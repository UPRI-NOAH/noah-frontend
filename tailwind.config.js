const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

module.exports = {
  purge: ['./src/**/*.{html,ts}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', ...defaultTheme.fontFamily.sans],
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
