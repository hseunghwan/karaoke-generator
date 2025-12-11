# Karaoke Generator Frontend

> **Multilingual Karaoke Video Generator SaaS**
> AI-powered platform for creating synchronized karaoke videos with multi-language subtitles, tailored for YouTube, TikTok, and Shorts.

## 🚀 Overview

**Karaoke Generator** is a SaaS platform designed for content creators, music educators, and karaoke channel operators. It automates the creation of high-quality karaoke videos by providing:

- **Precision Sync**: Syllable/beat-level synchronization for professional karaoke experiences.
- **Multi-language Support**: Automatic translation and dual/triple subtitle templates (Original + Translation + Pronunciation).
- **Platform Optimization**: Ready-to-upload presets for YouTube, TikTok, and YouTube Shorts.
- **Rights Management**: Pre-flight rights check to minimize copyright strikes.
- **Batch Processing**: Efficiently handle bulk video creation jobs.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Internationalization**: `next-i18n-router`, `i18next`

## 📋 Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: v18.17.0 or higher
- **pnpm**: v9.0.0 or higher (Strictly enforced)

> **Note**: This project uses `pnpm` for package management. Please do not use `npm` or `yarn`.

## ⚡ Getting Started

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd karaoke-generator/frontend
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Run the development server:**

    ```bash
    pnpm dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the development server with hot-reloading. |
| `pnpm build` | Builds the application for production. |
| `pnpm start` | Starts the production server. |
| `pnpm lint` | Runs ESLint to catch code quality issues. |

## 📂 Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages & layouts
│   ├── components/       # Reusable UI components
│   │   ├── dashboard/    # Dashboard-specific components
│   │   ├── jobs/         # Job creation & management components
│   │   ├── ui/           # Base UI primitives (Radix UI wrappers)
│   │   └── layout/       # Sidebar, Navbar, etc.
│   ├── lib/              # Utility functions and configurations
│   ├── store/            # Global state management (Zustand)
│   ├── types/            # TypeScript type definitions
│   └── locales/          # i18n translation files
├── public/               # Static assets
└── ...
```

## 🤝 Contributing

Please follow the coding standards defined in the project. Ensure all new features are accompanied by appropriate tests and documentation.

---

Built with ❤️ by the Karaoke Generator Team.
