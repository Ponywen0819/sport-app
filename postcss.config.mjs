/** @type {import('postcss-load-config').Config} */

const config = {
  content: ["./src/**/*.{html,js}"],
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
