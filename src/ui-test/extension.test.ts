import { Workbench, EditorView, WebView, By } from 'vscode-extension-tester';
import { expect } from 'chai';
import { WebElement } from "selenium-webdriver";

const sleepMs = (ms: number) => new Promise(r => setTimeout(r, ms));

// Variables initialized inside before are not usable oustside it/after/...
// it       inside it is not executed
// describe inside it is not executed
// When it and describe are at the same level, it are executed first


const caseIdArray = ["kebab-case", "camel-case", "pascal-case", "snake-case", "upper-snake-case", "capital-case", "path-case"];

interface CheckWords {
    whole: boolean;
    begin: boolean;
    end: boolean;
};

describe('WebViews', function () {

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

    before(async function () {
        this.timeout(8000);
        await beforeFunction();
    });

    after(async function () {
        await afterFunction();
    });

    // --------------------------------------------------------------------------------
    async function beforeFunction() {
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
    };

    // --------------------------------------------------------------------------------
    async function afterFunction() {
        await view.switchBack();
        await new EditorView().closeAllEditors();
    };

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

        expect(await allCases.isSelected()).equals(false);
        for (const elt of caseArray) {
            const selected = !unselecteds.includes(elt);
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

    async function checkTextToSearch(text: string) {
        expect(await textToSearch.isDisplayed()).equals(true);
        expect(await textToSearch.isEnabled()).equals(true);
        expect(await textToSearch.getAttribute("value")).has.string(text);
    };

    // --------------------------------------------------------------------------------
    async function checkWords({whole, begin, end}: CheckWords) {
        for (const elt of [wholeWord, beginWord, endWord]) {
            expect(await elt.isDisplayed()).equals(true);
            expect(await elt.isEnabled()).equals(true);
        }

        expect(await wholeWord.isSelected()).equals(whole);
        expect(await beginWord.isSelected()).equals(begin);
        expect(await endWord.isSelected()).equals(end);
    };

    // --------------------------------------------------------------------------------
    async function checkInitialState() {
        await checkCasesAllSelected();
        await checkSensitiveCase(true);
        await checkTextToSearch('');
        await checkWords({whole: false, begin: false, end: false});
    };

    // --------------------------------------------------------------------------------
    describe('check initial state', async function () {
        it('initial state', async function () {
            await checkInitialState();
        });
    });
    
    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    describe('Cases', async function () {

        // --------------------------------------------------------------------------------
        it('unselect allCases', async function () {
            allCases.click();
            await checkCasesNoneSelected();
            await checkWords({whole: false, begin: false, end: false});
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
                await checkWords({whole: false, begin: false, end: false});
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
            await checkWords({whole: false, begin: false, end: false});
        });

        // --------------------------------------------------------------------------------
        caseIdArray.forEach((caseId) => {
            it(`select 1 case ${caseId}`, async function () {
                const caseCheckbox = await retrieve(caseId);
                caseCheckbox.click();

                await checkCasesSomeSelected([caseCheckbox]);
                await checkWords({whole: false, begin: false, end: false});
            });

            it(`unselect 1 case ${caseId}`, async function () {
                const caseCheckbox = await retrieve(caseId);
                caseCheckbox.click();

                await checkCasesNoneSelected();
                await checkWords({whole: false, begin: false, end: false});
            });
        });

        // --------------------------------------------------------------------------------
        it('select allCases', async function () {
            allCases.click();
            await checkInitialState();
        });
    });

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    describe('Begin/End/Whole Word', async function () {
        // --------------------------------------------------------------------------------
        describe('Whole Word', async function () {
            it('select Whole Word', async function () {
                wholeWord.click();
                await checkWords({whole: true,  begin: true,  end: true});
            });
            it('unselect Whole Word', async function () {
                wholeWord.click();
                await checkWords({whole: false, begin: false, end: false});
            });
        });

        // --------------------------------------------------------------------------------
        describe('Begin Word', async function () {
            it('select Begin Word', async function () {
                beginWord.click();
                await checkWords({whole: false, begin: true,  end: false});
            });
            it('unselect Begin Word', async function () {
                beginWord.click();
                await checkWords({whole: false, begin: false, end: false});
            });
        });

        // --------------------------------------------------------------------------------
        describe('End Word', async function () {
            it('select End Word', async function () {
                endWord.click();
                await checkWords({whole: false, begin: false, end: true});
            });
            it('unselect End Word', async function () {
                endWord.click();
                await checkWords({whole: false, begin: false, end: false});
            });
        });

        // --------------------------------------------------------------------------------
        describe('Begin + End Word', async function () {
            it('select Begin Word', async function () {
                beginWord.click();
                await checkWords({whole: false, begin: true,  end: false});
            });
            it('select End Word', async function () {
                endWord.click();
                await checkWords({whole: true,  begin: true,  end: true});
            });
            it('unselect Begin Word', async function () {
                beginWord.click();
                await checkWords({whole: false, begin: false, end: true});
            });
            it('unselect End Word', async function () {
                endWord.click();
                await checkWords({whole: false, begin: false, end: false});
            });
        });

        // --------------------------------------------------------------------------------
        describe('Return to initial state', async function () {
            it('checkInitialState', async function () {
                await checkInitialState();
            });
        });
    });

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    describe('sensitiveCase', async function () {

        it('Check initial state', async function () {
            await checkSensitiveCase(true);
        });
        it('select sensitiveCase', async function () {
            sensitiveCase.click();
            await checkSensitiveCase(false);
        });
        it('unselect sensitiveCase', async function () {
            sensitiveCase.click();
            await checkSensitiveCase(true);
        });
    });

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    describe('textToSearch incremental', async function () {
        it('key by key', async function () {
            await checkTextToSearch('');

            const expected: string = "abcdefghijklm123456xyz";
            for (const char of expected) {
                await textToSearch.sendKeys(char);
            }
            await checkTextToSearch(expected);

            await textToSearch.clear();
        });
        // Send mutiple keys simultaneously has random behavior
        // Perhaps keys are entered when input does not have the focus
        // So comment all tests
        // it('mutiple keys simultaneously 1', async function () {
        //     await checkTextToSearch('');

        //     await textToSearch.sendKeys("abcdefghijklm");
        //     await sleepMs(100);
        //     // KO with sleepMs(100): abcd
        //     await checkTextToSearch('abcdefghijklm');

        //     await textToSearch.sendKeys("123456");
        //     await sleepMs(100);
        //     // KO with sleepMs(100): abcdefghijklm1234
        //     await checkTextToSearch('abcdefghijklm123456');

        //     await textToSearch.clear();
        // });
        // it('mutiple keys simultaneously 2', async function () {
        //     await checkTextToSearch('');

        //     await textToSearch.sendKeys("abcdefghi");
        //     await sleepMs(100);
        //     // KO without sleepMs:   abc
        //     // KO with sleepMs(100): abcdabcdefgh
        //     await checkTextToSearch('abcdefghi');

        //     await textToSearch.sendKeys("123456");
        //     await sleepMs(100);
        //     // KO with sleepMs(100): abcdefghijklm12ab123
        //     await checkTextToSearch('abcdefghi123456');

        //     await textToSearch.clear();
        // });
        // it('mutiple keys 3', async function () {
        //     await checkTextToSearch('');

        //     await textToSearch.sendKeys("abcdefghijklm");
        //     await sleepMs(100);
        //     // KO without sleepMs:   abcabc
        //     // KO with sleepMs(100): abcdabcdefghabc
        //     // KO with sleepMs(100): abcde
        //     await checkTextToSearch('abcdefghijklm');

        //     await textToSearch.sendKeys("123");
        //     await sleepMs(100);
        //     // KO with sleepMs(100): abcdefghijklm12ab123abc123
        //     await checkTextToSearch('abcdefghijklm123');

        //     await textToSearch.clear();
        // });
    });
});
