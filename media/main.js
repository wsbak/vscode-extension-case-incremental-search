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
    const caseWholeWord     = document.getElementById('case-whole-word');
    const caseBeginWord     = document.getElementById('case-begin-word');
    const caseEndWord       = document.getElementById('case-end-word');
    const textToSearch      = document.getElementById('text-to-search');
    const allCases          = document.getElementById('all-cases');
    const kebabCase         = document.getElementById('kebab-case');
    const camelCase         = document.getElementById('camel-case');
    const pascalCase        = document.getElementById('pascal-case');
    const snakeCase         = document.getElementById('snake-case');
    const upperSnakeCase    = document.getElementById('upper-snake-case');
    const capitalCase       = document.getElementById('capital-case');
    const pathCase          = document.getElementById('path-case');

    // When 1 checkbox of a group becomes checked, all checkboxes ot the other group are unchecked
    const exclusiveCheckboxGroupsArray = [
        [[wholeWord, beginWord, endWord], [caseWholeWord, caseBeginWord, caseEndWord]],  // any xxxWord and any caseXxxWord are incompatibles
    ];

    // When check/uncheck mainCheckbox  : all subCheckboxes are modified the same way
    // When check/uncheck a subCheckbox : mainCheckbox.checked = all subCheckboxes are checked
    const mainCheckboxSubCheckboxesArray = [
        [wholeWord,     [beginWord, endWord]],
        [caseWholeWord, [caseBeginWord, caseEndWord]],
        [allCases,      [kebabCase, camelCase, pascalCase, snakeCase, upperSnakeCase, capitalCase, pathCase]],
    ];

    // Hide all of 1st group if any of the 2nd group is checked
    const hideCheckboxGroupIfAnyArray = [
        [[beginWord, endWord], [allCases, kebabCase, camelCase, pascalCase, snakeCase, upperSnakeCase, capitalCase, pathCase]],
    ];
    // Show all of 1st group if any of the 2nd group is checked
    const showCheckboxGroupIfAnyArray = [
        [[caseWholeWord, caseBeginWord, caseEndWord], [allCases, kebabCase, camelCase, pascalCase, snakeCase, upperSnakeCase, capitalCase, pathCase]],
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

    // Returns undefined if checkboxChanged is not part of checkboxGroupIfAnyArray
    // Returns true      if any checkbox of checkboxGroupIfAnyArray is checked
    // Returns false     othewise
    function computeHideShowCheckboxGroupIfAny(checkboxChanged, checkboxGroupIfAnyArray) {
        if (checkboxGroupIfAnyArray.includes(checkboxChanged)) {
            let anyChecked = false;
            for (const checkbox of checkboxGroupIfAnyArray) {
                anyChecked = anyChecked || checkbox?.checked;
            }
            return anyChecked;
        }
        return undefined;
    }

    // Hide or show checkbox
    function hideCheckbox(checkbox, hide) {
        // Must hide the parent div to also hide the label
        const div = checkbox.parentNode;
        if (hide) {
            div?.classList.add('hidden');
        }
        else {
            div?.classList.remove('hidden');
        }
    }

    // Disable or enable checkbox
    // Disable seems better than hide
    function disableCheckbox(checkbox, disable) {
        if (disable) {
            checkbox.disabled = true;
        }
        else {
            checkbox?.removeAttribute('disabled');
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
    
    function manageHideShowCheckboxGroupIfAny(checkboxChanged) {
        for (const hideCheckboxGroupIfAny of hideCheckboxGroupIfAnyArray) {
            const anyChecked = computeHideShowCheckboxGroupIfAny(checkboxChanged, hideCheckboxGroupIfAny[1]);
            if (anyChecked !== undefined) {
                for (const checkbox of hideCheckboxGroupIfAny[0]) {
                    disableCheckbox(checkbox, anyChecked);
                }
            }
        }
        for (const showCheckboxGroupIfAny of showCheckboxGroupIfAnyArray) {
            const anyChecked = computeHideShowCheckboxGroupIfAny(checkboxChanged, showCheckboxGroupIfAny[1]);
            if (anyChecked !== undefined) {
                for (const checkbox of showCheckboxGroupIfAny[0]) {
                    disableCheckbox(checkbox, !anyChecked);
                }
            }
        }
    }

    // Compute/update the visibilities of the checkboxes
    function initializeHideShowCheckboxGroupIfAny() {
        for (const hideCheckboxGroupIfAny of hideCheckboxGroupIfAnyArray) {
            const noneChecked = [...hideCheckboxGroupIfAny[1]].every(checkbox => checkbox.checked !== true);
            const anyChecked = noneChecked !== true;
            for (const checkbox of hideCheckboxGroupIfAny[0]) {
                disableCheckbox(checkbox, anyChecked);
            }
        }
        for (const showCheckboxGroupIfAny of showCheckboxGroupIfAnyArray) {
            const noneChecked = [...showCheckboxGroupIfAny[1]].every(checkbox => checkbox.checked !== true);
            for (const checkbox of showCheckboxGroupIfAny[0]) {
                disableCheckbox(checkbox, noneChecked);
            }
        }
    }

    // Manage dependencies
    function manage(event) {
        manageExclusiveCheckboxGroups(event.target);
        manageMainCheckboxSubCheckboxes(event.target);
        manageHideShowCheckboxGroupIfAny(event.target);

        // When incrementalSearch, okButton is useless
        hideButton(okButton, incrementalSearch?.checked)
    }

    // Compute dependencies
    initializeMainCheckboxSubCheckboxes();
    initializeHideShowCheckboxGroupIfAny();
    manage(incrementalSearch);

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
