// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    const mmi = new mmi_media.MediaMmi((message) => { vscode.postMessage(message); });

    const sensitiveCase = document.getElementById('sensitive-case');
    const textToSearch  = document.getElementById('text-to-search');

    // Hide or show button
    function hideButton(button, hide) {
        if (hide) {
            button?.setAttribute('hidden', 'hidden');
        }
        else {
            button?.removeAttribute('hidden');
        }
    }
    
    // Focus on textToSearch at beginning
    textToSearch?.focus();
    // Cursor at the end of the text
    textToSearch.selectionStart = textToSearch.selectionEnd = 10000;

    // Mmi item which has the focus before incremental sendSearchCommand
    let focusItem = undefined;

    function sendSearchCommand(command) {
        const message = {
            command:           command,
            sensitiveCase:     sensitiveCase?.checked,
            text:              textToSearch?.value,
        };
        mmi.mediaUpdateMainMessage(message);
        vscode.postMessage(message);
    }

    function searchIncremental(event) {
        focusItem = event.target;
        sendSearchCommand('main-instant');
    }

    // Handle html events
    mmi.mediaAddEventListener(                (event) => { searchIncremental(event); });
    sensitiveCase?. addEventListener('input', (event) => { searchIncremental(event); });
    textToSearch?.  addEventListener('input', (event) => { searchIncremental(event); });

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
