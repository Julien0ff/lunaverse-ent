/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        discord: {
          blurple: '#5865F2',
          dark: '#2C2F33',
          darker: '#1E2124',
          darkest: '#18191C',
          success: '#57F287',
          error: '#ED4245',
          warning: '#FEE75C',
          muted: '#8D9299',
        },
      },
    },
  },
  plugins: [],
}
