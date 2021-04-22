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
