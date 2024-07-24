# 🌳 UI Flow Generator



## 📖 Table of Contents
- [About](#about)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)


## 🚀 About

UI Flow Generator is a powerful tool designed to visualize and analyze the structure of your React projects. By generating interactive, hierarchical diagrams of your component dependencies, it helps developers understand, document, and optimize their project architecture.



## ✨ Features

- 🔍 **Automatic Dependency Analysis**: Scans your project files and identifies component relationships.
- 🌿 **Hierarchical Visualization**: Displays your project structure in an easy-to-understand tree-like diagram.
- 🖱️ **Interactive Graph**: Zoom, pan, and click nodes to explore your project structure.
- 🎨 **Customizable Styling**: Adjust node colors, sizes, and layout to suit your preferences.
- 📏 **Depth Control**: Filter the view to show only the desired levels of dependency.
- 💾 **Export Functionality**: Save your visualizations as SVG files for documentation or sharing.

## 🛠️ Installation

```bash
git clone https://github.com/CJduncan/Ui-Flow.git
cd ui-flow-generator
npm install
```

## 🖥️ Usage

1. Start the application:
   ```bash
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3000`.

3. Drag and drop your project folder into the designated area or use the file picker to select your project.

4. Explore your project's UI flow!

## ⚙️ Configuration

You can customize the behavior of UI Flow Generator by modifying the following files:

- `src/config/fileTypes.js`: Add or remove file extensions to be included in the analysis.
- `src/config/ignoreList.js`: Specify directories or files to be excluded from the analysis.
- `src/styles/nodeStyles.js`: Customize the appearance of nodes in the graph.

## 🤝 Contributing

We welcome contributions to UI Flow Generator! 

