/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./admin*.html",
    "./cabinet*.html",
    "./login.html",
    "./privacy.html",
    "./product-manage.html",
    "./real-estate-solution.html",
    "./admin*.js",
    "./cabinet*.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10B981',
        secondary: '#0088CC',
        mint: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
        },
        tgblue: {
          500: '#0088CC',
          600: '#006699',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 25px rgba(0, 0, 0, 0.08)',
        'large': '0 8px 40px rgba(0, 0, 0, 0.12)',
      },
    }
  },
  plugins: [],
}

