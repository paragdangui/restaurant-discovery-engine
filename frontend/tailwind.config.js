/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue", 
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  theme: {
    extend: {
      colors: {
        // Updated theme to match provided palette
        // Palette reference:
        // Tea green:   #CAE7B9
        // Flax:        #F3DE8A
        // Coral pink:  #EB9486
        // Cool gray:   #7E7F9A
        // Cadet gray:  #97A7B3
        primary: {
          50: '#FFF1EF',
          100: '#FBDAD6',
          200: '#F5BEB6',
          300: '#F0A49B',
          400: '#EC8E86',
          500: '#EB9486', // Coral pink (base)
          600: '#D97F71',
          700: '#C26B5D',
          800: '#A9584B',
          900: '#8C453B',
        },
        secondary: {
          50: '#F3FAEF',
          100: '#EAF7E1',
          200: '#DDF1CE',
          300: '#CAE7B9', // Tea green (base)
          400: '#B5DCA1',
          500: '#A0D089',
          600: '#86B66F',
          700: '#6C9C58',
          800: '#527F43',
          900: '#3A5E30',
        },
        // Use Cadet gray as the neutral/surface scale
        surface: {
          50: '#F1F5F7',
          100: '#DEE7ED',
          200: '#C5D2DC',
          300: '#AEBBC8',
          400: '#99A7B6',
          500: '#97A7B3',
          600: '#8292A0',
          700: '#6C7A86',
          800: '#555F69',
          900: '#3E444B',
        },
        background: {
          light: '#ffffff',
          dark: '#121212',
        },
        // Re-map semantic scales to palette
        error: {
          50: '#FFECEA',
          100: '#FFD2CD',
          200: '#FFB5AC',
          300: '#FF998F',
          400: '#F9837A',
          500: '#EB6A62',
          600: '#D95C55',
          700: '#C24F49',
          800: '#A8443F',
          900: '#8B3732',
        },
        warning: {
          50: '#FFF9E6',
          100: '#FEF1C8',
          200: '#FBE6A3',
          300: '#F6DC8A',
          400: '#F1D373',
          500: '#F3DE8A', // Flax
          600: '#E3C969',
          700: '#C8AD4E',
          800: '#A78F3C',
          900: '#7F692A',
        },
        info: {
          50: '#EEF0F6',
          100: '#D9DCE8',
          200: '#BFC3D5',
          300: '#A6AAC3',
          400: '#8F93B0',
          500: '#7E7F9A', // Cool gray
          600: '#6B6C86',
          700: '#595A70',
          800: '#47485A',
          900: '#343545',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif']
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      boxShadow: {
        'material-1': '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
        'material-2': '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
        'material-3': '0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)',
        'material-4': '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
        'material-6': '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)',
        'material-8': '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
      }
    }
  },
  plugins: [],
}
