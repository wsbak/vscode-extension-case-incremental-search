// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    const okButton          = document.getElementById('okButton');
    const incrementalSearch = document.getElementById('incremental-search');
    const sensitiveCase     = document.getElementById('sensitive-case');
    const wholeWord         = document.getElementById('whole-word');
    const beginWord         = document.getElementById('begin-word');
    const endWord           = document.getElementById('end-word');
    const textToSearch      = document.getElementById('text-to-search');
    const allCases          = document.getElementById('all-cases');
    const kebabCase         = document.getElementById('kebab-case');
    const camelCase         = document.getElementById('camel-case');
    const pascalCase        = document.getElementById('pascal-case');
    const snakeCase         = document.getElementById('snake-case');
    const upperSnakeCase    = document.getElementById('upper-snake-case');
    const capitalCase       = document.getElementById('capital-case');
    const pathCase          = document.getElementById('path-case');

    // When check/uncheck mainCheckbox  : all subCheckboxes are modified the same way
    // When check/uncheck a subCheckbox : mainCheckbox.checked = all subCheckboxes are checked
    const mainCheckboxSubCheckboxesArray = [
        [wholeWord,     [beginWord, endWord]],
        [allCases,      [kebabCase, camelCase, pascalCase, snakeCase, upperSnakeCase, capitalCase, pathCase]],
    ];

    // If checkboxChanged is part of an mainCheckboxSubCheckboxes
    // If checkboxChanged is mainCheckbox  : all subCheckboxes are modified the same way
    // If checkboxChanged is a subCheckbox : mainCheckbox.checked = all subCheckboxes are checked
    function manageMainCheckboxSubCheckboxes(checkboxChanged) {
        for (const mainCheckboxSubCheckboxes of mainCheckboxSubCheckboxesArray) {
            if (mainCheckboxSubCheckboxes[0] === checkboxChanged) {
                // Change all subCheckboxes
                for (const checkbox of mainCheckboxSubCheckboxes[1]) {
                    checkbox.checked = checkboxChanged?.checked;
                }
            }
            else if (mainCheckboxSubCheckboxes[1].includes(checkboxChanged)) {
                // Compute the mainCheckbox
                const allChecked = [...mainCheckboxSubCheckboxes[1]].every(checkbox => checkbox.checked);
                mainCheckboxSubCheckboxes[0].checked = allChecked;
            }
        }
    }

    // Compute/update the main checkboxes
    function initializeMainCheckboxSubCheckboxes() {
        for (const mainCheckboxSubCheckboxes of mainCheckboxSubCheckboxesArray) {
            // Compute the mainCheckbox
            const allChecked = [...mainCheckboxSubCheckboxes[1]].every(checkbox => checkbox.checked);
            mainCheckboxSubCheckboxes[0].checked = allChecked;
        }
    }

    // Hide or show button
    function hideButton(button, hide) {
        if (hide) {
            button?.setAttribute('hidden', 'hidden');
        }
        else {
            button?.removeAttribute('hidden');
        }
    }
    
    // Manage dependencies
    function manage(event) {
        manageMainCheckboxSubCheckboxes(event.target);

        // When incrementalSearch, okButton is useless
        hideButton(okButton, incrementalSearch?.checked)
    }

    // Compute dependencies
    initializeMainCheckboxSubCheckboxes();
    // When incrementalSearch, okButton is useless
    hideButton(okButton, incrementalSearch?.checked)

    // Focus on textToSearch at beginning
    textToSearch?.focus();
    // Cursor at the end of the text
    textToSearch.selectionStart = textToSearch.selectionEnd = 10000;

    // Mmi item which has the focus before incremental sendSearchCommand
    let focusItem = undefined;

    function sendSearchCommand(command) {
        vscode.postMessage({
            command:           command,
            incrementalSearch: incrementalSearch?.checked,
            sensitiveCase:     sensitiveCase?.checked,
            beginWord:         beginWord?.checked,
            endWord:           endWord?.checked,
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
    
        if (!incrementalSearch?.checked) {
            focusItem = undefined;
            sendSearchCommand('saveStatus');
            return;
        }
    
        focusItem = event.target;
        sendSearchCommand('text-to-search');
    }

    document.getElementById('okButton')?.addEventListener('click', () => {
        sendSearchCommand('okButton');
    });
    textToSearch?.addEventListener("keyup", ({key}) => {
        if (key === "Enter") {
            sendSearchCommand('okButton');
        }
    });

    incrementalSearch?.addEventListener('input', (event) => { manage(event); searchIncremental(event); });

    allCases?.      addEventListener('input', (event) => { manage(event); searchIncremental(event); });
    kebabCase?.     addEventListener('input', (event) => { manage(event); searchIncremental(event); });
    camelCase?.     addEventListener('input', (event) => { manage(event); searchIncremental(event); });
    pascalCase?.    addEventListener('input', (event) => { manage(event); searchIncremental(event); });
    snakeCase?.     addEventListener('input', (event) => { manage(event); searchIncremental(event); });
    upperSnakeCase?.addEventListener('input', (event) => { manage(event); searchIncremental(event); });
    capitalCase?.   addEventListener('input', (event) => { manage(event); searchIncremental(event); });
    pathCase?.      addEventListener('input', (event) => { manage(event); searchIncremental(event); });
    sensitiveCase?. addEventListener('input', (event) => { manage(event); searchIncremental(event); });
    textToSearch?.  addEventListener('input', (event) => {                searchIncremental(event); });
    wholeWord?.     addEventListener('input', (event) => { manage(event); searchIncremental(event); });
    beginWord?.     addEventListener('input', (event) => { manage(event); searchIncremental(event); });
    endWord?.       addEventListener('input', (event) => { manage(event); searchIncremental(event); });

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
