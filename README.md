# background-cover-ishotihadus

Forked version of [AShujiao/vscode-background-cover](https://github.com/vscode-extension/vscode-background-cover).

## Diff

- Support custom CSS
  - See config `backgroundCover.customCss`
- Config `backgroundCover.opacity` is used as is without modification
- Fix localization

## How to build VSIX by yourself

Make sure you have installed Node.

Install [vsce](https://code.visualstudio.com/api/working-with-extensions/publishing-extension), the CLI tool for managing VS Code extensions.

    $ npm install -g vsce

Clone this repository.

    $ git clone https://github.com/Ishotihadus/vscode-background-cover
    $ cd vscode-background-cover

Install dependencies.

    $ npm install

Build the package.

    $ vsce package

Then, a vsix file named `background-cover-ishotihadus-x.x.x.vsix` is created.

You can install it from the VSCode command `Extensions: Install from VSIX...`.
