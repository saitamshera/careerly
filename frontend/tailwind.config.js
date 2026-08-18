/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' }
        }
      },
      animation: {
        floaty: 'floaty 7s ease-in-out infinite',
        shimmer: 'shimmer 12s linear infinite'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.08), 0 24px 60px rgba(15,23,42,0.35)',
        halo: '0 0 0 1px rgba(255,255,255,0.12), 0 30px 80px rgba(251,191,36,0.16)'
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(circle at top, rgba(251,191,36,0.18), transparent 40%), linear-gradient(180deg, rgba(15,23,42,1), rgba(2,6,23,1))',
        aurora:
          'radial-gradient(circle at 20% 20%, rgba(251,191,36,0.24), transparent 30%), radial-gradient(circle at 80% 30%, rgba(56,189,248,0.20), transparent 25%), radial-gradient(circle at 50% 75%, rgba(16,185,129,0.14), transparent 30%)'
      },
      colors: {
        ink: {
          950: '#020617',
          900: '#0f172a'
        }
      }
    }
  },
  plugins: []
};