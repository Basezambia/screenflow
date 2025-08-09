import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brutalist accent colors
        brutal: {
          yellow: "hsl(var(--brutal-yellow))",
          red: "hsl(var(--brutal-red))",
          blue: "hsl(var(--brutal-blue))",
          green: "hsl(var(--brutal-green))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        none: "0",
      },
      borderWidth: {
        '3': '3px',
        '5': '5px',
        '8': '8px',
      },
      boxShadow: {
        'brutal': '4px 4px 0px hsl(var(--foreground))',
        'brutal-lg': '8px 8px 0px hsl(var(--foreground))',
        'brutal-xl': '12px 12px 0px hsl(var(--foreground))',
        'brutal-inset': 'inset 4px 4px 0px hsl(var(--foreground))',
      },
      fontFamily: {
        'brutal': ['Space Grotesk', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'brutal-xs': ['0.75rem', { lineHeight: '1', letterSpacing: '0.05em' }],
        'brutal-sm': ['0.875rem', { lineHeight: '1.1', letterSpacing: '0.025em' }],
        'brutal-base': ['1rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'brutal-lg': ['1.125rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'brutal-xl': ['1.25rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'brutal-2xl': ['1.5rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        'brutal-3xl': ['1.875rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
        'brutal-4xl': ['2.25rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
      },
      spacing: {
        'brutal': '4px',
        'brutal-lg': '8px',
        'brutal-xl': '12px',
      },
      animation: {
        "brutal-blink": "brutal-blink 1s steps(2, end) infinite",
        "brutal-shake": "brutal-shake 0.5s ease-in-out",
        "brutal-bounce": "brutal-bounce 0.3s ease-out",
      },
      keyframes: {
        "brutal-blink": {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        "brutal-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "brutal-bounce": {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
