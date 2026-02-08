# Help Me Write

A cross-platform (Windows) background application that fixes grammar in any text input field using a global hotkey.

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (current LTS)
*   [Rust](https://www.rust-lang.org/tools/install)
*   **Windows**: Build Tools for Visual Studio 2022.
*   **macOS**: Xcode Command Line Tools (`xcode-select --install`).

### Installation

1.  Clone the repository:
    ```bash
    git clone <your-repo-url>
    cd help-me-write
    ```

2.  Install NPM dependencies:
    ```bash
    npm install
    ```

### Running Development Build

To run the app in development mode with hot-reloading:

```bash
npm run tauri dev
```

*   The app runs in the background.
*   Press **`Ctrl + Shift + Space`** (Windows) or configured shortcut to trigger the UI[Todo].

### Building for Production

To create an optimized executable:

```bash
npm run tauri build
```

The output binary will be located in `src-tauri/target/release/`.

## 🛠 Features

*   **Global Hotkey**: Triggers from any application.
*   **Context Aware**: Reads selected text from the active window.
*   **AI Correction**: Suggests grammar fixes (Mock Engine currently).
*   **Cross-Platform**: Designed for Windows and macOS. [Todo]
