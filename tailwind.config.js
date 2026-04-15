import daisyui from "daisyui";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {}
  },
  daisyui: {
    themes: ["light"]
  },
  plugins: [daisyui]
};
