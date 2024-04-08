// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    const okButton          = document.getElementById('okButton');
    const incrementalSearch = document.getElementById('incremental-search');
    const sensitiveCase     = document.getElementById('sensitive-case');
    const wholeWord         = document.getElementById('whole-word');
    const textToSearch      = document.getElementById('text-to-search');
    const kebabCase         = document.getElementById('kebab-case');
    const camelCase         = document.getElementById('camel-case');
    const pascalCase        = document.getElementById('pascal-case');
    const snakeCase         = document.getElementById('snake-case');
    const upperSnakeCase    = document.getElementById('upper-snake-case');
    const capitalCase       = document.getElementById('capital-case');
    const pathCase          = document.getElementById('path-case');

    // Mmi item which has the focus before incremental sendSearchCommand
    let focusItem = undefined;

    function sendSearchCommand(command) {
        console.log("sendSearchCommand", command);
        console.log("text-to-search input", textToSearch?.value);
        vscode.postMessage({
            command:           command,
            incrementalSearch: incrementalSearch?.checked,
            sensitiveCase:     sensitiveCase?.checked,
            wholeWord:         wholeWord?.checked,
            text:              textToSearch?.value,
            kebabCase:         kebabCase?.checked,
            camelCase:         camelCase?.checked,
            pascalCase:        pascalCase?.checked,
            snakeCase:         snakeCase?.checked,
            upperSnakeCase:    upperSnakeCase?.checked,
            capitalCase:       capitalCase?.checked,
            pathCase:          pathCase?.checked,
        });
    }

    function searchIncremental(event) {
        console.log("searchIncremental");
    
        if (!incrementalSearch?.checked) {
            console.log("input but not incrementalSearch");
            focusItem = undefined;
            return;
        }
    
        focusItem = event.target;
        sendSearchCommand('text-to-search');
    }

    document.getElementById('okButton')?.addEventListener('click', () => {
        console.log("okButton click");
        sendSearchCommand('okButton');
    });
    textToSearch?.addEventListener("keyup", ({key}) => {
        if (key === "Enter") {
            console.log("Enter key");
            sendSearchCommand('okButton');
        }
    })

    incrementalSearch?.addEventListener('input', (event) => {
        // When incrementalSearch, okButton is useless
        if (incrementalSearch?.checked) {
            okButton?.setAttribute('hidden', 'hidden')
        }
        else {
            okButton?.removeAttribute('hidden')
        }
    });

    sensitiveCase?. addEventListener('input', (event) => { searchIncremental(event); });
    wholeWord?.     addEventListener('input', (event) => { searchIncremental(event); });
    textToSearch?.  addEventListener('input', (event) => { searchIncremental(event); });
    kebabCase?.     addEventListener('input', (event) => { searchIncremental(event); });
    camelCase?.     addEventListener('input', (event) => { searchIncremental(event); });
    pascalCase?.    addEventListener('input', (event) => { searchIncremental(event); });
    snakeCase?.     addEventListener('input', (event) => { searchIncremental(event); });
    upperSnakeCase?.addEventListener('input', (event) => { searchIncremental(event); });
    capitalCase?.   addEventListener('input', (event) => { searchIncremental(event); });
    pathCase?.      addEventListener('input', (event) => { searchIncremental(event); });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'focus':
                // Focus comes back to the item which has triggered incremental sendSearchCommand
                focusItem?.focus();
                break;
        }
    });
}());
