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

        async function getElementById(id: string): Promise<WebElement> {
            return await view.findWebElement(By.id(id));
        }

        before(async function () {
            this.timeout(8000);
            await new Workbench().executeCommand('case-incremental-search.start');
            await new Promise((res) => { setTimeout(res, 500); });
            view = new WebView();
            await view.switchToFrame();

            allCases          = await getElementById('all-cases');
            kebabCase         = await getElementById('kebab-case');
            camelCase         = await getElementById('camel-case');
            pascalCase        = await getElementById('pascal-case');
            snakeCase         = await getElementById('snake-case');
            upperSnakeCase    = await getElementById('upper-snake-case');
            capitalCase       = await getElementById('capital-case');
            pathCase          = await getElementById('path-case');
        
            sensitiveCase     = await getElementById('sensitive-case');
            textToSearch      = await getElementById('text-to-search');
    
            wholeWord         = await getElementById('whole-word');
            beginWord         = await getElementById('begin-word');
            endWord           = await getElementById('end-word');
            caseWholeWord     = await getElementById('case-whole-word');
            caseBeginWord     = await getElementById('case-begin-word');
            caseEndWord       = await getElementById('case-end-word');
    
            incrementalSearch = await getElementById('incremental-search');
            okButton          = await getElementById('okButton');
            // const element = await getElementById('does-not-exists0');   // throw inside it/..., no throw outside
        });

        after(async function () {
            await view.switchBack();
            await new EditorView().closeAllEditors();
        });

        // it('findWebElement works', async function () {
        //     const element = await view.findWebElement(By.css('title'));
        //     expect(await element.getText()).has.string('Case Search');     // KO vide
        // });

        // it('findWebElements works', async function () {
        //     const elements = await view.findWebElements(By.css('title'));
        //     expect(elements.length).equals(1);
        // });

        it('findWebElement works', async function () {
            const element = await view.findWebElement(By.id('all-cases'));
            expect(element).not.null;
            // expect(await element.getText()).has.string('All');    // KO vide
        });

        // it('findWebElement works', async function () {
        //     const element = await view.findWebElement(By.id('does-not-exists'));    // throw inside it, no throw outside
        //     // expect(element).null;
        // });

        // --------------------------------------------------------------------------------
        // Initial state
        // --------------------------------------------------------------------------------
        it('initial cases', async function () {
            for (const elt of [allCases, kebabCase, camelCase, pascalCase, snakeCase, upperSnakeCase, capitalCase, pathCase]) {
                expect(await elt.getAttribute('type')).has.string('checkbox');
                expect(await elt.isDisplayed()).equals(true);
                expect(await elt.isEnabled()).equals(true);
                expect(await elt.isSelected()).equals(false);
            }
        });

        it('initial sensitiveCase', async function () {
            for (const elt of [sensitiveCase]) {
                expect(await elt.getAttribute('type')).has.string('checkbox');
                expect(await elt.isDisplayed()).equals(true);
                expect(await elt.isEnabled()).equals(true);
                expect(await elt.isSelected()).equals(true);
            }
        });

        it('initial textToSearch', async function () {
            for (const elt of [textToSearch]) {
                expect(await elt.getAttribute('type')).has.string('text');
                expect(await elt.isDisplayed()).equals(true);
                expect(await elt.isEnabled()).equals(true);
                expect(await elt.getText()).has.string('');
            }
        });

        it('initial words', async function () {
            for (const elt of [wholeWord, beginWord, endWord]) {
                expect(await elt.getAttribute('type')).has.string('checkbox');
                expect(await elt.isDisplayed()).equals(true);
                expect(await elt.isEnabled()).equals(true);
                expect(await elt.isSelected()).equals(false);
            }
        });

        it('initial caseWords', async function () {
            for (const elt of [caseWholeWord, caseBeginWord, caseEndWord]) {
                expect(await elt.getAttribute('type')).has.string('checkbox');
                expect(await elt.isDisplayed()).equals(true);
                expect(await elt.isEnabled()).equals(true);
                expect(await elt.isSelected()).equals(false);
            }
        });

        it('initial incrementalSearch', async function () {
            for (const elt of [incrementalSearch]) {
                expect(await elt.getAttribute('type')).has.string('checkbox');
                expect(await elt.isDisplayed()).equals(true);
                expect(await elt.isEnabled()).equals(true);
                expect(await elt.isSelected()).equals(true);
            }
        });

        it('initial okButton', async function () {
            for (const elt of [okButton]) {
                expect(await elt.getAttribute('type')).has.string('submit');
                expect(await elt.isDisplayed()).equals(false);
            }
        });
    });
});
