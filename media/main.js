// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    const okButton          = document.getElementById('okButton');
    const incrementalSearch = document.getElementById('incremental-search');
    const sensitiveCase     = document.getElementById('sensitive-case');
    const wholeWord         = document.getElementById('whole-word');
    const caseWholeWord     = document.getElementById('case-whole-word');
    const caseWholeWord_subCheckboxes = document.querySelectorAll('.case-whole-word-subCheckbox');
    const caseBeginWord     = document.getElementById('case-begin-word');
    const caseEndWord       = document.getElementById('case-end-word');
    const textToSearch      = document.getElementById('text-to-search');
    const kebabCase         = document.getElementById('kebab-case');
    const camelCase         = document.getElementById('camel-case');
    const pascalCase        = document.getElementById('pascal-case');
    const snakeCase         = document.getElementById('snake-case');
    const upperSnakeCase    = document.getElementById('upper-snake-case');
    const capitalCase       = document.getElementById('capital-case');
    const pathCase          = document.getElementById('path-case');

    // Focus on textToSearch at beginning
    textToSearch?.focus();
    // Cursor at the end of the text
    textToSearch.selectionStart = textToSearch.selectionEnd = 10000;

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
            caseBeginWord:     caseBeginWord?.checked,
            caseEndWord:       caseEndWord?.checked,
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
    });

    incrementalSearch?.addEventListener('input', (event) => {
        // When incrementalSearch, okButton is useless
        if (incrementalSearch?.checked) {
            okButton?.setAttribute('hidden', 'hidden');
        }
        else {
            okButton?.removeAttribute('hidden');
        }
    });

    kebabCase?.     addEventListener('input', (event) => { searchIncremental(event); });
    camelCase?.     addEventListener('input', (event) => { searchIncremental(event); });
    pascalCase?.    addEventListener('input', (event) => { searchIncremental(event); });
    snakeCase?.     addEventListener('input', (event) => { searchIncremental(event); });
    upperSnakeCase?.addEventListener('input', (event) => { searchIncremental(event); });
    capitalCase?.   addEventListener('input', (event) => { searchIncremental(event); });
    pathCase?.      addEventListener('input', (event) => { searchIncremental(event); });
    sensitiveCase?. addEventListener('input', (event) => { searchIncremental(event); });
    textToSearch?.  addEventListener('input', (event) => { searchIncremental(event); });
    // wholeWord and any of caseXxxWord are incompatibles
    wholeWord?.     addEventListener('input', (event) => {
        if (wholeWord?.checked) {
            caseWholeWord.checked = false;
            caseBeginWord.checked = false;
            caseEndWord.checked   = false;
        }
        searchIncremental(event);
    });
    // caseWholeWord = caseBeginWord & caseEndWord
    caseWholeWord?. addEventListener('input', (event) => {
        if (caseWholeWord?.checked) {
            wholeWord.checked = false;
        }
        caseWholeWord_subCheckboxes.forEach(checkbox => {
            checkbox.checked = caseWholeWord?.checked;
        });
        searchIncremental(event);
    });
    caseWholeWord_subCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('input', function(event) {
            if (checkbox?.checked) {
                wholeWord.checked = false;
            }
            // Check if all subCheckboxes are checked
            const allChecked = [...caseWholeWord_subCheckboxes].every(checkbox => checkbox.checked);
            caseWholeWord.checked = allChecked;
            searchIncremental(event);
        });
    });

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
