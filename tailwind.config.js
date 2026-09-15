module.exports = {
  content: ["./docs/index.html"],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
      colors: {
        navy: { DEFAULT: '#1e3a5f', 50:'#eef3f8',100:'#d7e3ef',600:'#274a73',700:'#1e3a5f',800:'#152a45',900:'#0d1b2e' },
        teal: { DEFAULT: '#2f6f5e', 50:'#eef7f4',100:'#d6ede4',400:'#4c9c86',500:'#3a8b74',600:'#2f6f5e',700:'#25594b' }
      }
    }
  },
  plugins: []
}
