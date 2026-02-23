# 🏗 Formo Analytics Next.js Pages Router Example

[Documentation](https://help.formo.so) |
[Website](https://formo.so)

This is a working example of a Next.js app using Formo Analytics.

---

## Built with next-web3-template (by CJskii)

A **Next.js** Web3 project template, powered by **TypeScript**, **RainbowKit**, **Wagmi**, **Shadcn**, and **TailwindCSS**. This template is designed to streamline the creation of Web3 applications with **SIWE (Sign-In With Ethereum)** authentication, a theme toggler, and modern design patterns.

---

## ✨ **What's Included**

This template includes the following key features:

- **Next.js** with **TypeScript**: Full TypeScript support for modern, scalable applications.
- **RainbowKit + Wagmi**: Seamless Ethereum wallet connection and Web3 functionality with built-in wallet UI.
- **SIWE (Sign-In With Ethereum)**: Pre-configured authentication solution for decentralized logins using NextAuth.
- **TailwindCSS**: A utility-first CSS framework for fast and responsive design.
- **Shadcn Components**: A customizable component library built on TailwindCSS for building modern UIs.
- **Theme Toggle**: Dark/light mode toggler with TailwindCSS-based theme switching.
- **React Query**: Integrated for managing server state and caching.
- **NextAuth**: Secure authentication setup, with support for Web3-based logins.
- **Bun** for Fast Package Management: Support for Bun to speed up dependency installation and script execution.

---

## 🎯 **Goals of This Template**

The **Next.js + SIWE Template** aims to provide developers with a quick and efficient starting point for building Web3 applications. The key objectives are:

- **Speed**: Reduce the time to start a Web3 project by providing a pre-configured Next.js setup.
- **Ease of Use**: Provide a fully functional template that includes wallet integration, authentication, and styling out of the box.
- **Customizable**: Allow developers to extend or modify the template as per their project needs.
- **Best Practices**: Promote best practices by using well-maintained libraries like RainbowKit, Wagmi, NextAuth, Shadcn, and TailwindCSS.

---

## 🚀 **Getting Started**

### **Getting Started**

1. **Clone the repository:**

   ```bash
   git clone https://github.com/getformo/examples.git
   cd examples/with-next-page-router
   ```

2. **Install Dependencies:**

This project uses Bun for managing dependencies. If you don't have Bun installed, follow the installation instructions [here](https://bun.sh/docs/installation).

- Once Bun is installed, run:

```bash
bun install
```

- Set up Environment Variables:

Copy the .env.example file to .env.local and update the variables as needed:

```bash
cp .env.example .env.local
```

- Start the development server:

```bash
bun run dev
```

- Open http://localhost:3000 to view the app.

## 🔧 **Project Structure**

```bash
with-next-page-router/
│
├── public/                # Public assets (e.g., favicon)
│   └── favicon.ico
├── src/                   # Source files
│   ├── assets/            # Other assets
│   │   ├── icons/         # Icon assets
│   │   │   └── social.tsx
│   │   └── images/        # Image assets
│   ├── components/        # UI components
│   │   ├── navigation/    # Navigation elements
│   │   │   ├── header-sheet.tsx
│   │   │   ├── navbar.tsx
│   │   │   └── navigation-menu.tsx
│   │   └── ui/            # UI elements and components
│   │       ├── button.tsx
│   │       ├── connect-button.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── theme-toggler.tsx
│   │       ├── typography.tsx
│   │       └── footer.tsx
│   ├── lib/               # Utility functions and configurations
│   │   └── utils.ts
│   ├── pages/             # Next.js pages and API routes
│   │   ├── api/           # API routes (e.g., NextAuth)
│   │   │   └── auth/
│   │   │       └── [...nextauth].ts
│   │   ├── example/       # Example pages
│   │   │   └── index.tsx
│   │   ├── _app.tsx       # Next.js custom App component
│   │   ├── 404.tsx        # 404 page
│   │   └── index.tsx      # Homepage
│   ├── providers/         # React context providers
│   │   └── AnalyticsProvider.tsx
│   ├── styles/            # Global and module styles
│   │   └── globals.css
│   └── wagmi.ts           # Wagmi configuration for Web3
├── .env.example           # Example environment variables
├── .gitignore             # Files and directories to ignore in Git
├── bun.lockb              # Bun lock file for dependencies
├── components.json        # Shadcn component configuration
├── next-env.d.ts          # Next.js environment types
├── next.config.js         # Next.js configuration
├── package.json           # Project dependencies and scripts
├── postcss.config.js      # PostCSS configuration for TailwindCSS
├── README.md              # Project documentation
├── tailwind.config.ts     # TailwindCSS configuration
└── tsconfig.json          # TypeScript configuration

```

---

## 📃 **License**

This project is licensed under the [MIT License](LICENSE).

---

## 📢 **Contact**

For any questions or inquiries, feel free to reach out via [GitHub issues](https://github.com/getformo/examples/issues) or open a discussion.
