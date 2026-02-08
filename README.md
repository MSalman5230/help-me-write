# Help Me Write

A (Windows) background application that fixes grammar in any text input field using a global hotkey.

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (current LTS)
*   [Rust](https://www.rust-lang.org/tools/install) and [Cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html) (Cargo is included when you install Rust via rustup)
*   **Windows**: Build Tools for Visual Studio 2022.
*   **macOS**: TODO.

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
*   Press **`Ctrl + Shift + Space`** (Windows) or configured shortcut to trigger the UI.

### Building for Production

To create an optimized executable:

```bash
npm run tauri build
```

The output binary will be located in `src-tauri/target/release/`.

### Releasing to GitHub

To publish installers (e.g. Windows `.exe` / installer) to **GitHub Releases**:

1. **One-time setup**: In your repo on GitHub go to **Settings → Actions → General**, under "Workflow permissions" choose **Read and write permissions**, then Save.
2. **Trigger a release** (pick one):
   - **Manual**: Go to **Actions → Release** → click **Run workflow** → Run workflow. The run will use the version from `src-tauri/tauri.conf.json` (e.g. `0.1.0` → tag `v0.1.0`).
   - **From branch**: Push or merge to the `release` branch.
   - **From tag**: Create and push a version tag, e.g. `git tag v0.1.0 && git push origin v0.1.0`.
3. When the workflow finishes, open **Releases** on GitHub. A **draft** release will be created with the built installers attached. Edit the release and click **Publish** when ready.

The workflow builds for **Windows** and **Linux** by default. To add macOS, uncomment the `macos-latest` entries in `.github/workflows/release.yml`.

## 🛠 Features

*   **Global Hotkey**: Triggers from any application.
*   **Context Aware**: Reads selected text from the active window.
*   **AI Correction**: Suggests Structure, grammar and Spelling fixes.