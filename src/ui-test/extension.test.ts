import { Workbench, EditorView, WebView, By } from 'vscode-extension-tester';
import { expect } from 'chai';
import { WebElement } from "selenium-webdriver";

// variables initialized inside before are not usable oustside it/after/...
// it       inside it is not executed
// describe inside it is not executed


const caseIdArray = ["kebab-case", "camel-case", "pascal-case", "snake-case", "upper-snake-case", "capital-case", "path-case"];

interface CheckWords {
    someCaseSelected: boolean;
    whole: boolean;
    begin: boolean;
    end: boolean;
};

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
        let caseArray: WebElement[];  // All previous except allCases
    
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
            caseArray         = [kebabCase, camelCase, pascalCase, snakeCase, upperSnakeCase, capitalCase, pathCase];

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
        // retrieve a case checkbox by its id
        async function retrieve(caseId: string): Promise<WebElement> {
            // const elt = await view.findWebElement(By.id(caseId));
            //  will not give the exact same result
            //  i.e. it will not work into  caseArray.includes(elt);

            for (const elt of [allCases, ...caseArray]) {
                if (await elt.getAttribute('id') === caseId) {
                    return elt;
                }
            }

            const explain = `ERROR caseId ${caseId} not found`;
            console.log(explain);
            throw Error(explain);
        };

        // --------------------------------------------------------------------------------
        describe('check once types', async function () {
            it('cases', async function () {
                for (const elt of [allCases, ...caseArray]) {
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
        describe('check once checkbox <-> label', async function () {
        });

        // --------------------------------------------------------------------------------
        async function checkCasesNoneSelected() {
            for (const elt of [allCases, ...caseArray]) {
                expect(await elt.isDisplayed()).equals(true);
                expect(await elt.isEnabled()).equals(true);
                expect(await elt.isSelected()).equals(false);
            }
        };
        async function checkCasesSomeSelected(selecteds: WebElement[]) {
            for (const elt of [allCases, ...caseArray]) {
                expect(await elt.isDisplayed()).equals(true);
                expect(await elt.isEnabled()).equals(true);
            }

            expect(await allCases.isSelected()).equals(false);
            for (const elt of caseArray) {
                const selected = selecteds.includes(elt);
                expect(await elt.isSelected()).equals(selected);
            }
        };
        async function checkCasesSomeUnselected(unselecteds: WebElement[]) {
            for (const elt of [allCases, ...caseArray]) {
                expect(await elt.isDisplayed()).equals(true);
                expect(await elt.isEnabled()).equals(true);
            }

            for (const unselected of unselecteds) {
                console.log(`unselected.id=${await unselected.getAttribute('id')}`);
            }

            expect(await allCases.isSelected()).equals(false);
            for (const elt of caseArray) {
                const selected = !unselecteds.includes(elt);
                console.log(`elt.id=${await elt.getAttribute('id')} selected=${selected}`);
                expect(await elt.isSelected()).equals(selected);
            }
        };
        async function checkCasesAllSelected() {
            for (const elt of [allCases, ...caseArray]) {
                expect(await elt.isDisplayed()).equals(true);
                expect(await elt.isEnabled()).equals(true);
                expect(await elt.isSelected()).equals(true);
            }
        };

        // --------------------------------------------------------------------------------
        async function checkSensitiveCase(selected: boolean) {
            expect(await sensitiveCase.isDisplayed()).equals(true);
            expect(await sensitiveCase.isEnabled()).equals(true);
            expect(await sensitiveCase.isSelected()).equals(selected);
        };

        async function checkIncrementalSearch(selected: boolean) {
            expect(await incrementalSearch.isDisplayed()).equals(true);
            expect(await incrementalSearch.isEnabled()).equals(true);
            expect(await incrementalSearch.isSelected()).equals(selected);
        };

        async function checkOkButton(displayed: boolean) {
            expect(await okButton.isDisplayed()).equals(displayed);
            expect(await okButton.isEnabled()).equals(true);
        };

        async function checkTextToSearch(text: string) {
            expect(await textToSearch.isDisplayed()).equals(true);
            expect(await textToSearch.isEnabled()).equals(true);
            expect(await textToSearch.getText()).has.string(text);
        };

        // --------------------------------------------------------------------------------
        async function checkWords({someCaseSelected, whole, begin, end}: CheckWords) {
            expect(await wholeWord.isDisplayed()).equals(true);
            expect(await wholeWord.isEnabled()).equals(true);

            const enabled = someCaseSelected !== true;
            for (const elt of [beginWord, endWord]) {
                expect(await elt.isDisplayed()).equals(true);
                expect(await elt.isEnabled()).equals(enabled);
            }

            expect(await wholeWord.isSelected()).equals(whole);
            expect(await beginWord.isSelected()).equals(begin);
            expect(await endWord.isSelected()).equals(end);
        };

        // --------------------------------------------------------------------------------
        async function checkCaseWords({someCaseSelected, whole, begin, end}: CheckWords) {
            const enabled = someCaseSelected === true;
            for (const elt of [caseWholeWord, caseBeginWord, caseEndWord]) {
                expect(await elt.isDisplayed()).equals(true);
                expect(await elt.isEnabled()).equals(enabled);
            }

            expect(await caseWholeWord.isSelected()).equals(whole);
            expect(await caseBeginWord.isSelected()).equals(begin);
            expect(await caseEndWord.isSelected()).equals(end);
        };

        // --------------------------------------------------------------------------------
        async function checkInitialState() {
            await checkCasesAllSelected();
            await checkSensitiveCase(true);
            await checkTextToSearch('');
            await checkWords({someCaseSelected: true, whole: false, begin: false, end: false});
            await checkCaseWords({someCaseSelected: true, whole: false, begin: false, end: false});
            await checkIncrementalSearch(true);
            await checkOkButton(false);
        };

        // --------------------------------------------------------------------------------
        it('initial state', async function () {
            await checkInitialState();
        });
        
        // --------------------------------------------------------------------------------
        it('unselect allCases', async function () {
            allCases.click();
            await checkCasesNoneSelected();
            await checkWords({someCaseSelected: false, whole: false, begin: false, end: false});
            await checkCaseWords({someCaseSelected: false, whole: false, begin: false, end: false});
        });

        // --------------------------------------------------------------------------------
        it('select allCases', async function () {
            allCases.click();
            await checkInitialState();
        });

        // --------------------------------------------------------------------------------
        caseIdArray.forEach((caseId) => {
            it(`unselect 1 case ${caseId}`, async function () {
                const caseCheckbox = await retrieve(caseId);
                caseCheckbox.click();

                await checkCasesSomeUnselected([caseCheckbox]);
                await checkWords({someCaseSelected: true, whole: false, begin: false, end: false});
                await checkCaseWords({someCaseSelected: true, whole: false, begin: false, end: false});
            });

            it(`select 1 case ${caseId}`, async function () {
                const caseCheckbox = await retrieve(caseId);
                caseCheckbox.click();

                await checkInitialState();
            });
        });

        // --------------------------------------------------------------------------------
        it('unselect allCases', async function () {
            allCases.click();
            await checkCasesNoneSelected();
            await checkWords({someCaseSelected: false, whole: false, begin: false, end: false});
            await checkCaseWords({someCaseSelected: false, whole: false, begin: false, end: false});
        });

        // --------------------------------------------------------------------------------
        caseIdArray.forEach((caseId) => {
            it(`select 1 case ${caseId}`, async function () {
                const caseCheckbox = await retrieve(caseId);
                caseCheckbox.click();

                await checkCasesSomeSelected([caseCheckbox]);
                await checkWords({someCaseSelected: true, whole: false, begin: false, end: false});
                await checkCaseWords({someCaseSelected: true, whole: false, begin: false, end: false});
            });

            it(`unselect 1 case ${caseId}`, async function () {
                const caseCheckbox = await retrieve(caseId);
                caseCheckbox.click();

                await checkCasesNoneSelected();
                await checkWords({someCaseSelected: false, whole: false, begin: false, end: false});
                await checkCaseWords({someCaseSelected: false, whole: false, begin: false, end: false});
            });
        });
    });
});
