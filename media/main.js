// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    const okButton          = document.getElementById('okButton');
    const incrementalSearch = document.getElementById('incremental-search');
    const sensitiveCase     = document.getElementById('sensitive-case');
    const wholeWord         = document.getElementById('whole-word');
    const caseWholeWord     = document.getElementById('case-whole-word');
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

    // When 1 checkbox of a group becomes checked, all checkboxes ot the other group are unchecked
    const exclusiveCheckboxGroupsArray = [
        [[wholeWord], [caseWholeWord, caseBeginWord, caseEndWord]],  // wholeWord and any of caseXxxWord are incompatibles
    ];

    // When check/uncheck mainCheckbox  : all subCheckboxes are modified the same way
    // When check/uncheck a subCheckbox : mainCheckbox.checked = all subCheckboxes are checked
    const mainCheckboxSubCheckboxesArray = [
        [caseWholeWord, [caseBeginWord, caseEndWord]],    // caseWholeWord = caseBeginWord & caseEndWord
    ];

    // If checkboxChanged is part of an exclusiveCheckboxGroups AND is checked
    //  all checkboxes ot the other group are unchecked
    function manageExclusiveCheckboxGroups(checkboxChanged) {
        for (const exclusiveCheckboxGroups of exclusiveCheckboxGroupsArray) {
            if (exclusiveCheckboxGroups[0].includes(checkboxChanged)) {
                if (checkboxChanged?.checked) {
                    for (const checkbox of exclusiveCheckboxGroups[1]) {
                        checkbox.checked = false;
                    }
                }
            }
            if (exclusiveCheckboxGroups[1].includes(checkboxChanged)) {
                if (checkboxChanged?.checked) {
                    for (const checkbox of exclusiveCheckboxGroups[0]) {
                        checkbox.checked = false;
                    }
                }
            }
        }
    }

    // If checkboxChanged is part of an mainCheckboxSubCheckboxes
    // If checkboxChanged is mainCheckbox   : all subCheckboxes are modified the same way
    //  If checkboxChanged is a subCheckbox : mainCheckbox.checked = all subCheckboxes are checked
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

    // Manage dependencies
    function manage(event) {
        manageExclusiveCheckboxGroups(event.target);
        manageMainCheckboxSubCheckboxes(event.target);
    }

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
    caseWholeWord?. addEventListener('input', (event) => { manage(event); searchIncremental(event); });
    caseBeginWord?. addEventListener('input', (event) => { manage(event); searchIncremental(event); });
    caseEndWord?.   addEventListener('input', (event) => { manage(event); searchIncremental(event); });

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
