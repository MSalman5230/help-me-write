# Help Me Write

A (Windows) background application that fixes grammar in any text input field using a global hotkey.

## 🛠 Features

*   **Global Hotkey**: Triggers from any application.
*   **Context Aware**: Reads selected text from the active window. (No need to copy paste.)
*   **AI Correction**: Suggests Structure, grammar and Spelling fixes.

## 📖 How to use

### Install and set up

1. **Download** the `.exe` installer or the portable ZIP from [Releases](https://github.com/MSalman5230/help-me-write/releases).
2. **Run** the installer, or (if using portable) extract the ZIP and run the app.
3. **Open settings** from the system tray icon → **Settings**.
4. **Choose a provider** and configure it:
   - **Ollama**: Set up [Ollama](https://ollama.com/) locally.
   - **OpenAI** or **Google Gemini**: Enter your API key in the corresponding field.
5. **Set the model name** (e.g. `gpt-4`, `gemini-pro`, or your Ollama model).
6. Click **Test connection**, then **Save**.

### Fixing text

1. **Highlight** any text anywhere on your PC (browser, editor, chat, etc.).
2. Press **`Ctrl + Shift + Space`** to open the app. The highlighted text appears in the app window.
3. Click **Fix** to get a corrected version.
4. **Copy** the result from the app and paste it where you need it.

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

### Portable build (manual)

The release workflow does **not** build or upload the portable ZIP. To create and publish it yourself:

1. **Build** (on Windows): run `npm run build`. This runs `tauri build` and then creates a portable ZIP in `src-tauri/target/release/bundle/` (e.g. `Help Me Write_0.9.1_x64-portable.zip`).
2. **Upload**: Open the matching GitHub Release (draft or published), then drag the portable ZIP into the release assets and publish or save the draft.

