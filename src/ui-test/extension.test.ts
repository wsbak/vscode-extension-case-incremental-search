import { Workbench, EditorView, WebView, By } from 'vscode-extension-tester';
import { expect } from 'chai';
import { WebElement } from "selenium-webdriver";

describe('WebViews', function () {

    describe('Single WebView', async function () {

        let view: WebView;

        let allCases: WebElement;
        let kebabCase: WebElement;
        let camelCase: WebElement;
        let pascalCase: WebElement;
        let snakeCase: WebElement;
        let upperSnakeCase: WebElement;
        let capitalCase: WebElement;
        let pathCase: WebElement;
    
        let sensitiveCase: WebElement;
        let textToSearch: WebElement;

        let wholeWord: WebElement;
        let beginWord: WebElement;
        let endWord: WebElement;
        let caseWholeWord: WebElement;
        let caseBeginWord: WebElement;
        let caseEndWord: WebElement;

        let incrementalSearch: WebElement;
        let okButton: WebElement;

        before(async function () {
            this.timeout(8000);
            await new Workbench().executeCommand('case-incremental-search.start');
            await new Promise((res) => { setTimeout(res, 500); });
            view = new WebView();
            await view.switchToFrame();

            allCases          = await view.findWebElement(By.id('all-cases'));
            kebabCase         = await view.findWebElement(By.id('kebab-case'));
            camelCase         = await view.findWebElement(By.id('camel-case'));
            pascalCase        = await view.findWebElement(By.id('pascal-case'));
            snakeCase         = await view.findWebElement(By.id('snake-case'));
            upperSnakeCase    = await view.findWebElement(By.id('upper-snake-case'));
            capitalCase       = await view.findWebElement(By.id('capital-case'));
            pathCase          = await view.findWebElement(By.id('path-case'));

            sensitiveCase     = await view.findWebElement(By.id('sensitive-case'));
            textToSearch      = await view.findWebElement(By.id('text-to-search'));

            wholeWord         = await view.findWebElement(By.id('whole-word'));
            beginWord         = await view.findWebElement(By.id('begin-word'));
            endWord           = await view.findWebElement(By.id('end-word'));
            caseWholeWord     = await view.findWebElement(By.id('case-whole-word'));
            caseBeginWord     = await view.findWebElement(By.id('case-begin-word'));
            caseEndWord       = await view.findWebElement(By.id('case-end-word'));

            incrementalSearch = await view.findWebElement(By.id('incremental-search'));
            okButton          = await view.findWebElement(By.id('okButton'));
        });

        after(async function () {
            await view.switchBack();
            await new EditorView().closeAllEditors();
        });

        // --------------------------------------------------------------------------------
        describe('check once', async function () {
            it('cases', async function () {
                for (const elt of [allCases, kebabCase, camelCase, pascalCase, snakeCase, upperSnakeCase, capitalCase, pathCase]) {
                    expect(await elt.getAttribute('type')).has.string('checkbox');
                }
            });

            it('sensitiveCase', async function () {
                expect(await sensitiveCase.getAttribute('type')).has.string('checkbox');
            });

            it('textToSearch', async function () {
                expect(await textToSearch.getAttribute('type')).has.string('text');
            });

            it('words', async function () {
                for (const elt of [wholeWord, beginWord, endWord]) {
                    expect(await elt.getAttribute('type')).has.string('checkbox');
                }
            });

            it('caseWords', async function () {
                for (const elt of [caseWholeWord, caseBeginWord, caseEndWord]) {
                    expect(await elt.getAttribute('type')).has.string('checkbox');
                }
            });

            it('incrementalSearch', async function () {
                expect(await incrementalSearch.getAttribute('type')).has.string('checkbox');
            });

            it('okButton', async function () {
                expect(await okButton.getAttribute('type')).has.string('submit');
            });
        });

        // --------------------------------------------------------------------------------
        describe('initial state', async function () {
            it('cases', async function () {
                for (const elt of [allCases, kebabCase, camelCase, pascalCase, snakeCase, upperSnakeCase, capitalCase, pathCase]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(true);
                    expect(await elt.isSelected()).equals(true);
                }
            });

            it('sensitiveCase', async function () {
                for (const elt of [sensitiveCase]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(true);
                    expect(await elt.isSelected()).equals(true);
                }
            });

            it('textToSearch', async function () {
                for (const elt of [textToSearch]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(true);
                    expect(await elt.getText()).has.string('');
                }
            });

            it('words', async function () {
                for (const elt of [wholeWord]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(true);
                    expect(await elt.isSelected()).equals(false);
                }
                for (const elt of [beginWord, endWord]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(false);  // 1+ case selected
                    expect(await elt.isSelected()).equals(false);
                }
            });

            it('caseWords', async function () {
                for (const elt of [caseWholeWord, caseBeginWord, caseEndWord]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(true);  // 1+ case selected
                    expect(await elt.isSelected()).equals(false);
                }
            });

            it('incrementalSearch', async function () {
                for (const elt of [incrementalSearch]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(true);
                    expect(await elt.isSelected()).equals(true);
                }
            });

            it('okButton', async function () {
                for (const elt of [okButton]) {
                    expect(await elt.isDisplayed()).equals(false);
                }
            });
        });

        // --------------------------------------------------------------------------------
        describe('unselect allCases', async function () {
            it('unselect allCases', async function () {
                allCases.click();
            });

            it('cases selected', async function () {
                for (const elt of [allCases, kebabCase, camelCase, pascalCase, snakeCase, upperSnakeCase, capitalCase, pathCase]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(true);
                    expect(await elt.isSelected()).equals(false);
                }
            });

            it('words enabled', async function () {
                for (const elt of [wholeWord]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(true);
                    expect(await elt.isSelected()).equals(false);
                }
                for (const elt of [beginWord, endWord]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(true);  // no case selected
                    expect(await elt.isSelected()).equals(false);
                }
            });

            it('caseWords disabled', async function () {
                for (const elt of [caseWholeWord, caseBeginWord, caseEndWord]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(false);  // no case selected
                    expect(await elt.isSelected()).equals(false);
                }
            });
        });

        // --------------------------------------------------------------------------------
        describe('select allCases', async function () {
            it('select allCases', async function () {
                allCases.click();
            });

            it('cases selected', async function () {
                for (const elt of [allCases, kebabCase, camelCase, pascalCase, snakeCase, upperSnakeCase, capitalCase, pathCase]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(true);
                    expect(await elt.isSelected()).equals(true);
                }
            });

            it('begin/end word disabled', async function () {
                for (const elt of [wholeWord]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(true);
                    expect(await elt.isSelected()).equals(false);
                }
                for (const elt of [beginWord, endWord]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(false);  // 1+ case selected
                    expect(await elt.isSelected()).equals(false);
                }
            });

            it('caseWords enabled', async function () {
                for (const elt of [caseWholeWord, caseBeginWord, caseEndWord]) {
                    expect(await elt.isDisplayed()).equals(true);
                    expect(await elt.isEnabled()).equals(true);  // 1+ case selected
                    expect(await elt.isSelected()).equals(false);
                }
            });
        });
    });
});
