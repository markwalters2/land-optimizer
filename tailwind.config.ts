import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SISC design tokens — matches specialty-insurance-sc WP theme exactly
        sisc: {
          bg:         '#0a0a0a',
          bg2:        '#111111',
          bg3:        '#1a1a1a',
          bg4:        '#222222',
          green:      '#00ff41',
          'green-dim':'#00cc34',
          text:       '#e0e0e0',
          muted:      '#888888',
          dim:        '#555555',
        },
        // Keep legacy alias for any remaining neon-green references
        neon: {
          green:      '#00ff41',
          greenDark:  '#00cc34',
        },
      },
      borderRadius: {
        DEFAULT: '4px',
        sm:      '2px',
        md:      '4px',
        lg:      '8px',
        xl:      '8px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        green: '0 0 20px rgba(0, 255, 65, 0.15)',
        'green-lg': '0 0 40px rgba(0, 255, 65, 0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config;
