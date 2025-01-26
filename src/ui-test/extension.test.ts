import { Workbench, EditorView, WebView, By } from 'vscode-extension-tester';
import { SideBarView, ViewTitlePart, ViewContent } from "vscode-extension-tester";
import { expect } from 'chai';
import { Key, WebElement } from "selenium-webdriver";

const sleepMs = (ms: number) => new Promise(r => setTimeout(r, ms));

// Variables initialized inside before are not usable oustside it/after/...
// it       inside it is not executed
// describe inside it is not executed
// When it and describe are at the same level, it are executed first


const caseIdArray = ["kebabCase-checkbox", "camelCase-checkbox", "pascalCase-checkbox", "snakeCase-checkbox", "upperSnakeCase-checkbox", "capitalCase-checkbox", "pathCase-checkbox"];
const filesToIdArray = ["filesToInclude", "filesToExclude"];

class EditableLabel {
    public readonly label: WebElement;
    public readonly expected: {
        label: string,
    };
    constructor(label: WebElement, labelExpected: string) {
        this.label = label;
        this.expected = {
            label: labelExpected,
        };
    }
    async checkOnce() {
        expect(await this.label.getAttribute('type')).equals('text');
    }
    async check() {
        expect(await this.label.isDisplayed()).equals(true);
        expect(await this.label.isEnabled()).equals(true);
        expect(await this.label.getAttribute("value")).equals(this.expected.label);
    }
}

class Button {
    public readonly button: WebElement;
    public readonly expected: {
        enabled: boolean,
    };
    constructor(button: WebElement, enabled: boolean=true) {
        this.button = button;
        this.expected = {
            enabled: enabled,
        };
    }
    async checkOnce() {
        expect(await this.button.getAttribute('type')).equals('submit');
    }
    async check() {
        expect(await this.button.isDisplayed()).equals(true);
        expect(await this.button.isEnabled()).equals(this.expected.enabled);
    }
}

class EditButton {
    public readonly button: WebElement;
    public readonly editLabel: string = '\u{1F527}';   // "&#128295;"
    public readonly validLabel: string = '\u{2714}';   // "&#10004;"
    public readonly expected: {
        label: string,
        enabled: boolean,
    };
    constructor(button: WebElement, enabled: boolean=true) {
        this.button = button;
        this.expected = {
            label: this.editLabel,
            enabled: enabled,
        };
    }
    async checkOnce() {
        expect(await this.button.getAttribute('type')).equals('submit');
    }
    async check() {
        expect(await this.button.isDisplayed()).equals(true);
        expect(await this.button.isEnabled()).equals(this.expected.enabled);
        expect(await this.button.getText()).equals(this.expected.label);
    }
}

class AddEditableCheckbox {
    public readonly addButton: Button;
    constructor(addButton: WebElement) {
        this.addButton = new Button(addButton);
    }
    async checkOnce() {
        await this.addButton.checkOnce();
    }
    async checkInitialState() {
        await this.check();
    }
    async check() {
        await this.addButton.check();
    }
    async add() {
        await this.addButton.button.click();
        await this.check();
    }
}

class Checkbox {
    public readonly id: string;
    public readonly label: WebElement;
    public readonly checkbox: WebElement;
    public readonly expected: {
        label: string,
        selected: boolean,
    };
    constructor(id: string, label: WebElement, checkbox: WebElement, labelExpected: string, selectedExpected: boolean) {
        this.id = id;
        this.label = label;
        this.checkbox = checkbox;
        this.expected = {
            label: labelExpected,
            selected: selectedExpected,
        };
    }
    async checkOnce() {
        expect(await this.label.getTagName()).equals('label');
        // expect(await this.label.isEnabled()).equals(false);    says true, perhaps enabled has no meaning for label ?
        expect(await this.label.getText()).equals(this.expected.label);
        expect(await this.checkbox.getAttribute('type')).equals('checkbox');
        expect(await this.checkbox.isDisplayed()).equals(true);
        expect(await this.checkbox.isEnabled()).equals(true);
    }
    async check() {
        expect(await this.checkbox.isSelected()).equals(this.expected.selected);
    }
    async restore(previous: Checkbox) {
        this.expected.label = previous.expected.label;
        this.expected.selected = previous.expected.selected;
    }
    async select() {
        expect(this.expected.selected).equals(false);
        this.check();
        this.checkbox.click();
        this.expected.selected = true;
        this.check();
    }
    async unselect() {
        expect(this.expected.selected).equals(true);
        this.check();
        this.checkbox.click();
        this.expected.selected = false;
        this.check();
    }
}

class Cases {
    public  readonly all: Checkbox;
    public  readonly kebab: Checkbox;
    public  readonly camel: Checkbox;
    public  readonly pascal: Checkbox;
    public  readonly snake: Checkbox;
    public  readonly upperSnake: Checkbox;
    public  readonly capital: Checkbox;
    public  readonly path: Checkbox;
    public  readonly elts: Checkbox[];  // All previous except all

    static async new(view: WebView, previous: Cases | null): Promise<Cases> {
        const all = new Checkbox("case-checkbox",
                                 await view.findWebElement(By.id('case-label')),
                                 await view.findWebElement(By.id('case-checkbox')),
                                 "All",
                                 true);
        const kebab = new Checkbox("kebabCase-checkbox",
                                   await view.findWebElement(By.id('kebabCase-label')),
                                   await view.findWebElement(By.id('kebabCase-checkbox')),
                                   "kebab-case",
                                   true);
        const camel = new Checkbox("camelCase-checkbox",
                                   await view.findWebElement(By.id('camelCase-label')),
                                   await view.findWebElement(By.id('camelCase-checkbox')),
                                   "camelCase",
                                   true);
        const pascal = new Checkbox("pascalCase-checkbox",
                                   await view.findWebElement(By.id('pascalCase-label')),
                                   await view.findWebElement(By.id('pascalCase-checkbox')),
                                   "PascalCase",
                                   true);
        const snake = new Checkbox("snakeCase-checkbox",
                                   await view.findWebElement(By.id('snakeCase-label')),
                                   await view.findWebElement(By.id('snakeCase-checkbox')),
                                   "snake_case",
                                   true);
        const upperSnake = new Checkbox("upperSnakeCase-checkbox",
                                   await view.findWebElement(By.id('upperSnakeCase-label')),
                                   await view.findWebElement(By.id('upperSnakeCase-checkbox')),
                                   "UPPER_SNAKE_CASE",
                                   true);
        const capital = new Checkbox("capitalCase-checkbox",
                                   await view.findWebElement(By.id('capitalCase-label')),
                                   await view.findWebElement(By.id('capitalCase-checkbox')),
                                   "Capital Case",
                                   true);
        const path = new Checkbox("pathCase-checkbox",
                                   await view.findWebElement(By.id('pathCase-label')),
                                   await view.findWebElement(By.id('pathCase-checkbox')),
                                   "path/case",
                                   true);
        const instance = new Cases(all, kebab, camel, pascal, snake, upperSnake, capital, path);
        if (previous) {
            for (const elt of [instance.all, ...instance.elts]) {
                const previousElt = previous.retrieve(elt.id);
                elt.restore(previousElt);
            }
        }
        return instance;
    }
    private constructor(all: Checkbox,
                kebab: Checkbox,
                camel: Checkbox,
                pascal: Checkbox,
                snake: Checkbox,
                upperSnake: Checkbox,
                capital: Checkbox,
                path: Checkbox) {
        this.all = all;
        this.kebab = kebab;
        this.camel = camel;
        this.pascal = pascal;
        this.snake = snake;
        this.upperSnake = upperSnake;
        this.capital = capital;
        this.path = path;
        this.elts = [kebab, camel, pascal, snake, upperSnake, capital, path];
    }
    async checkOnce() {
        await this.all.checkOnce();
        for (const elt of this.elts) {
            await elt.checkOnce();
        }
    }
    async checkInitialState() {
        expect(this.all.expected.selected).equals(true);
        for (const elt of this.elts) {
            expect(elt.expected.selected).equals(true);
        }
        await this.check();
    }
    async check() {
        await sleepMs(50);  // sometimes, check fails even the screenshot is correct
        await this.all.check();
        for (const elt of this.elts) {
            await elt.check();
        }
    }
    async selectAll() {
        await this.all.select();
        // So all elts are selected
        for (const elt of this.elts) {
            elt.expected.selected = true;
        }
        await this.check();
    }
    async unselectAll() {
        await this.all.unselect();
        // So all elts are unselected
        for (const elt of this.elts) {
            elt.expected.selected = false;
        }
        await this.check();
    }
    async selectById(id: string) {
        const elt = this.retrieve(id);
        await elt.select();

        this.all.expected.selected = true;
        for (const elt of this.elts) {
            if (elt.expected.selected === false) {
                this.all.expected.selected = false;
                break;
            }
        }

        await this.check();
    }
    async unselectById(id: string) {
        const elt = this.retrieve(id);
        await elt.unselect();

        this.all.expected.selected = false;
        await this.check();
    }
    // retrieve a case checkbox by its id
    private retrieve(caseId: string): Checkbox {
        for (const elt of [this.all, ...this.elts]) {
            if (elt.id === caseId) {
                return elt;
            }
        }

        const explain = `ERROR caseId ${caseId} not found`;
        console.log(explain);
        throw Error(explain);
    }
}

class Word {
    public  readonly wholeCheckbox: Checkbox;
    public  readonly beginCheckbox: Checkbox;
    public  readonly endCheckbox: Checkbox;

    static async new(view: WebView, previous: Word | null): Promise<Word> {
        const whole = new Checkbox("word",
                                   await view.findWebElement(By.id('word-label')),
                                   await view.findWebElement(By.id('word-checkbox')),
                                   "Whole word",
                                   false);
        const begin = new Checkbox("beginWord",
                                   await view.findWebElement(By.id('beginWord-label')),
                                   await view.findWebElement(By.id('beginWord-checkbox')),
                                   "Begin word",
                                   false);
        const end = new Checkbox("endWord",
                                 await view.findWebElement(By.id('endWord-label')),
                                 await view.findWebElement(By.id('endWord-checkbox')),
                                 "End word",
                                 false);
        const instance = new Word(whole, begin, end);
        if (previous) {
            await instance.wholeCheckbox.restore(previous.wholeCheckbox);
            await instance.beginCheckbox.restore(previous.beginCheckbox);
            await instance.endCheckbox.restore(previous.endCheckbox);
        }
        return instance;
    }
    private constructor(wholeCheckbox: Checkbox, beginCheckbox: Checkbox, endCheckbox: Checkbox) {
        this.wholeCheckbox = wholeCheckbox;
        this.beginCheckbox = beginCheckbox;
        this.endCheckbox = endCheckbox;
    }
    async checkOnce() {
        await this.wholeCheckbox.checkOnce();
        await this.beginCheckbox.checkOnce();
        await this.endCheckbox.checkOnce();
    }
    async checkInitialState() {
        expect(this.wholeCheckbox.expected.selected).equals(false);
        expect(this.beginCheckbox.expected.selected).equals(false);
        expect(this.endCheckbox.expected.selected).equals(false);
        await this.check();
    }
    async check() {
        await sleepMs(50);  // sometimes, check fails even the screenshot is correct
        await this.wholeCheckbox.check();
        await this.beginCheckbox.check();
        await this.endCheckbox.check();
    }
    async wholeSelect() {
        await this.wholeCheckbox.select();
        this.beginCheckbox.expected.selected = true;
        this.endCheckbox.expected.selected = true;
        await this.check();
    }
    async wholeUnselect() {
        await this.wholeCheckbox.unselect();
        this.beginCheckbox.expected.selected = false;
        this.endCheckbox.expected.selected = false;
        await this.check();
    }
    async beginSelect() {
        await this.beginCheckbox.select();
        if (this.endCheckbox.expected.selected) {   
            this.wholeCheckbox.expected.selected = true;
        }
        await this.check();
    }
    async beginUnselect() {
        await this.beginCheckbox.unselect();
        this.wholeCheckbox.expected.selected = false;
        await this.check();
    }
    async endSelect() {
        await this.endCheckbox.select();
        if (this.beginCheckbox.expected.selected) {   
            this.wholeCheckbox.expected.selected = true;
        }
        await this.check();
    }
    async endUnselect() {
        await this.endCheckbox.unselect();
        this.wholeCheckbox.expected.selected = false;
        await this.check();
    }
}

class EditableCheckbox {
    public readonly id: string;
    public readonly subId: number;
    public readonly label: EditableLabel;
    public readonly checkbox: WebElement;
    public removeButton: Button;
    public readonly gripper: WebElement;
    public readonly expected: {
        selected: boolean,
    };

    static async new(view: WebView, id: string, subId: number, labelExpected: string): Promise<EditableCheckbox> {
        const eltMain = await view.findWebElement(By.id(`${id}-elt`));
        const label = new EditableLabel(await eltMain.findElement(By.id(`${id}-label`)), labelExpected);
        const removeButton = new Button(await eltMain.findElement(By.id(`${id}-removeElt`)));
        const gripper = await eltMain.findElement(By.className('codicon-gripper'));
        const elt = new EditableCheckbox(id,
                                        subId,
                                        label,
                                        await view.findWebElement(By.id(`${id}-checkbox`)),
                                        removeButton,
                                        gripper);
        return elt;
    }
    private constructor(id: string,
                subId: number,
                label: EditableLabel,
                checkbox: WebElement,
                removeButton: Button,
                gripper: WebElement) {
        this.id = id;
        this.subId = subId;
        this.label = label;
        this.checkbox = checkbox;
        this.removeButton = removeButton;
        this.gripper = gripper;
        this.expected = {
            selected: false,
        };
    }
    async checkOnce() {
        await this.label.checkOnce();
        expect(await this.checkbox.getAttribute('type')).equals('checkbox');
        expect(await this.checkbox.isDisplayed()).equals(true);
        expect(await this.checkbox.isEnabled()).equals(true);
        expect(await this.removeButton.checkOnce());
    }
    async check() {
        expect(await this.label.check());
        expect(await this.checkbox.isSelected()).equals(this.expected.selected);
        expect(await this.removeButton.check());
    };
    restore(previous: EditableCheckbox) {
        this.expected.selected = previous.expected.selected;
    }
}

class FilesTo {
    private readonly view: WebView;
    public  readonly id: string;
    public  readonly allCheckbox: Checkbox;
    public  readonly addEditableCheckbox: AddEditableCheckbox;
    private readonly elts: EditableCheckbox[] = [];
    private readonly defaultEltLabels: string[] = [];

    static async new(view: WebView, id: string, previous: FilesTo | null): Promise<FilesTo> {
        const all = new Checkbox(id,
                                 await view.findWebElement(By.id(`${id}-label`)),
                                 await view.findWebElement(By.id(`${id}-checkbox`)),
                                 "All",
                                 false);
        const add = new AddEditableCheckbox(await view.findWebElement(By.id(`${id}-addElt-apply`)));
        const instance = new FilesTo(view, id, all, add);

        if (previous) {
            // Restore expected values as previous
            // addEditableCheckbox : nothing to restore
            for (const previousElt of previous.elts) {
                const elt = await EditableCheckbox.new(instance.view, previousElt.id, previousElt.subId, previousElt.label.expected.label);
                elt.restore(previousElt);
                instance.elts.push(elt);
            }
            if (instance.elts.length > 0) {
                instance.allCheckbox.expected.selected = instance.elts.every(elt => elt.expected.selected);
            }
        }
        else {
            if (id === 'filesToInclude') {
                instance.defaultEltLabels.push("*.cpp,*.c,*.h");
                instance.defaultEltLabels.push("*.js,*.ts");
                instance.defaultEltLabels.push("*.java,*.kt");
                instance.defaultEltLabels.push("*.py");
                instance.defaultEltLabels.push("*.ini,*.conf");
                instance.defaultEltLabels.push("*.xml,*.json,*.yml");
            }
            else {
                instance.defaultEltLabels.push("*.o,*.a,*.dll,*.pyc");
                instance.defaultEltLabels.push("*.log,*.logs");
            }
            for (const defaultEltLabel of instance.defaultEltLabels) {
                await instance.addNewCheckboxElt(defaultEltLabel);
            }
        }

        return instance;
    }
    // constructor can not be async
    private constructor(view: WebView, id: string, allCheckbox: Checkbox, addEditableCheckbox: AddEditableCheckbox) {
        this.view = view;
        this.id = id;
        this.allCheckbox = allCheckbox;
        this.addEditableCheckbox = addEditableCheckbox;
    }
    async checkOnce() {
        await this.allCheckbox.checkOnce();
        await this.addEditableCheckbox.checkOnce();
    }
    async checkInitialState() {
        expect(this.elts.length).equals(this.defaultEltLabels.length);
        expect(this.allCheckbox.expected.selected).equals(false);
        await this.addEditableCheckbox.checkInitialState();
        await this.check();
        await this.checkOrder();
    }
    async check() {
        await sleepMs(50);  // sometimes, check fails even the screenshot is correct
        await this.allCheckbox.check();
        await this.addEditableCheckbox.check();
        for (const elt of this.elts) {
            await elt.check();
        }
        // Does not check others elts are present, use checkOrder
    }
    async checkOrder() {
        // Check no others elts are present
        // Check that WebElements id=`${elt.id}-Elt` are in same order as this.elts
        const group = await this.view.findWebElement(By.id(this.id));        
        const elements = await group.findElements(By.css('[id$="-elt"]'));
        expect(elements.length).equals(this.elts.length);
        for (let idx = 0; idx < this.elts.length; idx++) {
            const eltId = await elements[idx].getAttribute('id');
            expect(eltId).equals(`${this.elts[idx].id}-elt`);
        }
    }
    async addNewCheckbox(label: string): Promise<EditableCheckbox> {
        await this.addEditableCheckbox.add();
        // The new item is not selected, so all is automatically unselected
        this.allCheckbox.expected.selected = false;
        const elt = await this.addNewCheckboxElt(label);
        await elt.label.label.sendKeys(label);
        await this.check();
        return elt;
    }
    private async addNewCheckboxElt(label: string): Promise<EditableCheckbox> {
        let max = -1;
        for (const elt of this.elts) {
            max = Math.max(max, elt.subId);
        }
        const eltSubId = max + 1;

        const elt = await EditableCheckbox.new(this.view, `${this.id}-${eltSubId}`, eltSubId, label);
        await elt.checkOnce();

        this.elts.push(elt);
        return elt;
    }
    async selectAll() {
        await this.allCheckbox.select();
        // So all elts are selected
        for (const elt of this.elts) {
            elt.expected.selected = true;
        }
        await this.check();
    }
    async unselectAll() {
        await this.allCheckbox.unselect();
        // So all elts are unselected
        for (const elt of this.elts) {
            elt.expected.selected = false;
        }
        await this.check();
    }
    async select(elt: EditableCheckbox, expectAllSelected: boolean) {
        expect(await elt.checkbox.isSelected()).equals(false);
        await elt.checkbox.click();
        elt.expected.selected = true;

        this.allCheckbox.expected.selected = expectAllSelected;
        await this.check();
    }
    async unselect(elt: EditableCheckbox) {
        expect(await elt.checkbox.isSelected()).equals(true);
        await elt.checkbox.click();
        elt.expected.selected = false;

        this.allCheckbox.expected.selected = false;
        await this.check();
    }
    async remove(elt: EditableCheckbox, expectAllSelected: boolean) {
        await this.removeBase(elt);
        this.allCheckbox.expected.selected = expectAllSelected;
        await this.check();
    }
    async removeAll() {
        while (this.elts.length > 0) {
            await this.removeBase(this.elts[0]);
        }
        this.allCheckbox.expected.selected = false;
        await this.check();
    }
    // All checkbox not managed and no check 
    private async removeBase(elt: EditableCheckbox) {
        await elt.removeButton.button.click();

        this.elts.forEach((item, index) => {
            if(item.id === elt.id) {
                this.elts.splice(index, 1);
            }
        });
    }
    retrieveByLabel(label: string): EditableCheckbox {
        for (const elt of this.elts) {
            if (elt.label.expected.label === label) {
                return elt;
            }
        }
        expect(false).equals(true);
        return this.elts[0];  // to avoid compilation error
    }
    async dragAndDrop(sourceElt: EditableCheckbox, targetElt: EditableCheckbox) {
        const actions = this.view.getDriver().actions();
        await actions.dragAndDrop(sourceElt.gripper, targetElt.gripper).perform();

        // Reorder this.elts so sourceElt is moved before targetElt
        const sourceIndex = this.elts.findIndex(elt => elt.id === sourceElt.id);
        const targetIndex = this.elts.findIndex(elt => elt.id === targetElt.id);
        const [movedElt] = this.elts.splice(sourceIndex, 1);
        this.elts.splice(targetIndex, 0, movedElt);
        // Check WebElements are in the same order
        await this.checkOrder();
    }
    getSideBarTextExpected(): string {
        const selectedElts = this.elts.filter(elt => elt.expected.selected);
        return selectedElts.map(elt => elt.label.expected.label).join(',');
    }
}

class Mmi {
    public readonly cases: Cases;
    public readonly sensitiveCase: WebElement;
    public readonly textToSearch: WebElement;
    public readonly word: Word;
    public readonly filesToInclude: FilesTo;
    public readonly filesToExclude: FilesTo;

    static async new(view: WebView, previous: Mmi | null = null): Promise<Mmi> {
        const cases             = await Cases.new(view, previous ? previous.cases : null);
        const sensitiveCase     = await view.findWebElement(By.id('sensitive-case'));
        const textToSearch      = await view.findWebElement(By.id('text-to-search'));
        const word              = await Word.new(view, previous ? previous.word : null);
        const filesToInclude    = await FilesTo.new(view, 'filesToInclude', previous ? previous.filesToInclude : null);
        const filesToExclude    = await FilesTo.new(view, 'filesToExclude', previous ? previous.filesToExclude : null);

        const elt = new Mmi(cases, sensitiveCase, textToSearch, word, filesToInclude, filesToExclude);
        return elt;
    }
    // constructor can not be async
    private constructor(cases: Cases,
                        sensitiveCase: WebElement,
                        textToSearch: WebElement,
                        word: Word,
                        filesToInclude: FilesTo,
                        filesToExclude: FilesTo) {
        this.cases = cases;
        this.sensitiveCase = sensitiveCase;
        this.textToSearch = textToSearch;
        this.word = word;
        this.filesToInclude = filesToInclude;
        this.filesToExclude = filesToExclude;
    }
}

enum SideBarStatus {
    SearchNone,
    SearchWithoutFiles,
    SearchWithFiles,
}
class SideBar {
    private readonly view: WebView;
    private readonly mmi: Mmi;
    private          status: SideBarStatus = SideBarStatus.SearchNone;

    constructor(view: WebView,
                mmi: Mmi,
                previous: SideBar | null = null) {
        this.view = view;
        this.mmi = mmi;
        this.status = previous ? previous.status : SideBarStatus.SearchNone;
    }
    async checkFirstState() {
        expect(this.status).equals(SideBarStatus.SearchNone);
        await this.checkCurrentState();
    }
    async checkSearch() {
        if (this.status < SideBarStatus.SearchWithoutFiles) {
            this.status = SideBarStatus.SearchWithoutFiles;
        }
        await this.checkCurrentState();
    }
    async checkSearchSelectFiles() {
        if (this.status < SideBarStatus.SearchWithFiles) {
            this.status = SideBarStatus.SearchWithFiles;
        }
        await this.checkCurrentState();
    }
    // Use previous methods
    // Use this method only if you do not know the expected status (e.g using some describe.only)
    async checkCurrentState() {
        switch (this.status) {
            case SideBarStatus.SearchNone:         await this.checkSearchNone();   break;
            case SideBarStatus.SearchWithoutFiles: await this.checkSearchCommon(); break;
            case SideBarStatus.SearchWithFiles:    await this.checkSearchCommon(); break;
        }

        await this.view.switchToFrame(1000);
    }
    private async checkSearchNone() {
        await this.view.switchBack();

        const titlePart: ViewTitlePart = new SideBarView().getTitlePart();
        const title = await titlePart.getTitle();
        expect(title).equals("EXPLORER");
    }
    private async checkSearchCommon() {
        const textToSearch = await this.mmi.textToSearch.getAttribute("value");
        const isSensitiveCaseSelected = await this.mmi.sensitiveCase.isSelected();

        await this.view.switchBack();

        const sideBarView: SideBarView = new SideBarView();
        const titlePart: ViewTitlePart = sideBarView.getTitlePart();
        const title = await titlePart.getTitle();
        expect(title).equals("SEARCH");

        const content: ViewContent = sideBarView.getContent();
        const contentElt: WebElement = content.getEnclosingElement();
        // const htmlContent = await contentElt.getAttribute('outerHTML');
        // console.error('------------------------------------------------------------------------');
        // console.error('htmlContent', htmlContent);
        // console.error('------------------------------------------------------------------------');

        // // <div class="monaco-findInput">
        // // ...
        // // <div class="mirror" style="padding-right: 66px;">(?&lt;![a-zA-Z\d-])123abc|(?&lt;![a-zA-Z\d])123abc|(?&lt;![a-zA-Z\d_])123abc|(?&lt;![a-zA-Z\d_])123ABC|(?&lt;![a-zA-Z\d ])123abc|(?&lt;![a-zA-Z\d/])123abc</div>
        const findInputElt = await contentElt.findElement(By.className("monaco-findInput"));
        const findTextElt = await findInputElt.findElement(By.className("mirror"));
        const findText = await findTextElt.getAttribute('outerHTML');
        // Test not 100% good depending on the input/cases selected (which can transform the input)
        // E.g: "first_second" will be "firstSecond" in search sideBar if camelCase is selected
        expect(findText).has.string(textToSearch);

        // <div custom-hover="true" class="monaco-custom-toggle codicon codicon-case-sensitive" tabindex="0" role="checkbox" aria-checked="false" aria-label="Match Case (Alt+C)" style="color: inherit;"></div>
        const caseSensitiveChecked = await this.isButtonChecked(contentElt, 'codicon-case-sensitive');
        expect(caseSensitiveChecked).equals(isSensitiveCaseSelected);

        // <div custom-hover="true" class="monaco-custom-toggle codicon codicon-whole-word" tabindex="0" role="checkbox" aria-checked="false" aria-label="Match Whole Word (Alt+W)" style="color: inherit;"></div>
        const wholeWordChecked     = await this.isButtonChecked(contentElt, 'codicon-whole-word');
        expect(wholeWordChecked).equals(this.mmi.word.wholeCheckbox.expected.selected &&
                                        this.mmi.cases.elts.every(elt => ! elt.expected.selected));

        // <div custom-hover="true" class="monaco-custom-toggle codicon codicon-regex checked" tabindex="0" role="checkbox" aria-checked="true" aria-label="Use Regular Expression (Alt+R)" style="color: var(--vscode-inputOption-activeForeground); border-color: var(--vscode-inputOption-activeBorder); background-color: var(--vscode-inputOption-activeBackground);"></div>
        const regexChecked         = await this.isButtonChecked(contentElt, 'codicon-regex');
        expect(regexChecked).equals(true);

        // <input class="input" autocorrect="off" autocapitalize="off" spellcheck="false" type="text"
        //        wrap="off" aria-label="files to exclude"
        //        style="background-color: inherit; color: var(--vscode-input-foreground); width: 248px;">
        // Where is the text inside the input ?
        // Where is </input> ?
        const filesTo: WebElement[] = await contentElt.findElements(By.css("input"));
        expect(filesTo.length).equals(2);
        const filesToInclude = filesTo[0];
        const filesToExclude = filesTo[1];

        if (this.status === SideBarStatus.SearchWithoutFiles) {
            expect(await filesToInclude.isDisplayed()).equals(false);
            expect(await filesToExclude.isDisplayed()).equals(false);
            return;
        }

        // files to include/exclude are displayed
        expect(await filesToInclude.getAttribute('aria-label')).equals('files to include');
        expect(await filesToExclude.getAttribute('aria-label')).equals('files to exclude');
        expect(await filesToInclude.isDisplayed()).equals(true);
        expect(await filesToExclude.isDisplayed()).equals(true);

        const filesToIncludeText = await filesToInclude.getAttribute('value');
        const filesToExcludeText = await filesToExclude.getAttribute('value');
        expect(filesToIncludeText).equals(this.mmi.filesToInclude.getSideBarTextExpected());
        expect(filesToExcludeText).equals(this.mmi.filesToExclude.getSideBarTextExpected());
    }
    private async isButtonChecked(contentElt: WebElement, className: string): Promise<boolean> {
        const button: WebElement = await contentElt.findElement(By.className(className));
        const ariaChecked = await button.getAttribute('aria-checked');
        return ariaChecked === 'true';
    }
}

describe('WebViews', function () {

    let view: WebView;
    let mmi: Mmi;
    let sideBar: SideBar;

    before(async function () {
        this.timeout(8000);
        await beforeFunction();
    });

    after(async function () {
        await afterFunction();
    });

    // --------------------------------------------------------------------------------
    async function beforeFunction(previousMmi: Mmi | null = null,
                                  previousSideBar: SideBar | null = null) {
        await new Workbench().executeCommand('case-incremental-search.start');
        await sleepMs(500);
        view = new WebView();
        await view.switchToFrame();

        mmi     = await Mmi.new(view, previousMmi);
        sideBar = new SideBar(view, mmi, previousSideBar);
    };

    // --------------------------------------------------------------------------------
    async function afterFunction() {
        await view.switchBack();
        await new EditorView().closeAllEditors();
    };

    // --------------------------------------------------------------------------------
    async function takeScreenshot(webElement: WebElement, filename: string) {
        const screenshotBase64: string = await webElement.takeScreenshot();
        // console.error('screenshotBase64', screenshotBase64);
        const buf = Buffer.from(screenshotBase64, 'base64');
        const fs = require("fs");
        fs.writeFile(filename, buf, function(err: any) {
            if (err) { throw err; };
        });
    };

    // --------------------------------------------------------------------------------
    // retrieve a FilesTo instance by its id
    function retrieveFilesToById(filesToId: string): FilesTo {
        for (const elt of [mmi.filesToInclude, mmi.filesToExclude]) {
            if (elt.id === filesToId) {
                return elt;
            }
        }

        const explain = `ERROR filesToId ${filesToId} not found`;
        console.log(explain);
        throw Error(explain);
    };

    // --------------------------------------------------------------------------------
    describe('check once types', async function () {
        it('cases', async function () {
            await mmi.cases.checkOnce();
        });

        it('sensitiveCase', async function () {
            expect(await mmi.sensitiveCase.getAttribute('type')).equals('checkbox');
        });

        it('textToSearch', async function () {
            expect(await mmi.textToSearch.getAttribute('type')).equals('text');
        });

        it('words', async function () {
            await mmi.word.checkOnce();
        });

        it('filesTo', async function () {
            await mmi.filesToInclude.checkOnce();
            await mmi.filesToExclude.checkOnce();
        });
    });

    // --------------------------------------------------------------------------------
    async function checkSensitiveCase(selected: boolean) {
        expect(await mmi.sensitiveCase.isDisplayed()).equals(true);
        expect(await mmi.sensitiveCase.isEnabled()).equals(true);
        expect(await mmi.sensitiveCase.isSelected()).equals(selected);
    };

    async function checkTextToSearch(text: string) {
        expect(await mmi.textToSearch.isDisplayed()).equals(true);
        expect(await mmi.textToSearch.isEnabled()).equals(true);
        expect(await mmi.textToSearch.getAttribute("value")).equals(text);
    };

    // --------------------------------------------------------------------------------
    async function checkInitialState() {
        await mmi.cases.checkInitialState();
        await checkSensitiveCase(true);
        await checkTextToSearch('');
        await mmi.word.checkInitialState();
        await mmi.filesToInclude.checkInitialState();
        await mmi.filesToExclude.checkInitialState();
    };

    // --------------------------------------------------------------------------------
    describe('check initial state', async function () {
        it('initial state', async function () {
            await checkInitialState();
            await sideBar.checkFirstState();
        });
    });
    
    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    describe('Cases', async function () {

        // --------------------------------------------------------------------------------
        it('unselect allCases', async function () {
            await mmi.cases.unselectAll();
            await mmi.word.checkInitialState();
            await sideBar.checkSearch();  // check that regex is unselected
        });

        // --------------------------------------------------------------------------------
        it('select allCases', async function () {
            await mmi.cases.selectAll();
            await checkInitialState();
        });

        // --------------------------------------------------------------------------------
        caseIdArray.forEach((caseId) => {
            it(`unselect/select 1 case ${caseId}`, async function () {
                await mmi.cases.unselectById(caseId);
                await mmi.cases.selectById(caseId);
            });
        });

        // --------------------------------------------------------------------------------
        it('unselect allCases', async function () {
            await mmi.cases.unselectAll();
            await mmi.word.checkInitialState();
        });

        // --------------------------------------------------------------------------------
        caseIdArray.forEach((caseId) => {
            it(`select/unselect 1 case ${caseId}`, async function () {
                await mmi.cases.selectById(caseId);
                await mmi.cases.unselectById(caseId);
            });
        });

        // --------------------------------------------------------------------------------
        it('select allCases', async function () {
            await mmi.cases.selectAll();
            await checkInitialState();
        });
    });

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    describe('Begin/End/Whole Word', async function () {
        it('Whole Word', async function () {
            await mmi.word.wholeSelect();
            await sideBar.checkSearch();  // check that whole word is selected
            await mmi.word.wholeUnselect();
        });
        it('Begin Word', async function () {
            await mmi.word.beginSelect();
            await mmi.word.beginUnselect();
        });
        it('End Word', async function () {
            await mmi.word.endSelect();
            await mmi.word.endUnselect();
        });
        it('Begin + End Word select', async function () {
            await mmi.word.beginSelect();
            await mmi.word.endSelect();
        });
        it('Begin + End Word unselect', async function () {
            await mmi.word.beginUnselect();
            await mmi.word.endUnselect();
        });
        it('checkInitialState', async function () {
            await mmi.word.checkInitialState();
        });
    });

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    describe('sensitiveCase', async function () {

        it('Check initial state', async function () {
            await checkSensitiveCase(true);
        });
        it('select sensitiveCase', async function () {
            await mmi.sensitiveCase.click();
            await sideBar.checkSearch();  // check that sensitive case is unselected
            await checkSensitiveCase(false);
        });
        it('unselect sensitiveCase', async function () {
            await mmi.sensitiveCase.click();
            await checkSensitiveCase(true);
        });
    });

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    describe('textToSearch incremental', async function () {
        it('key by key', async function () {
            this.timeout(4000);

            await checkTextToSearch('');

            const expected: string = "abcdefghijklm123456xyz";
            for (const char of expected) {
                await mmi.textToSearch.sendKeys(char);
            }
            await checkTextToSearch(expected);
            await sideBar.checkSearch();

            await mmi.textToSearch.clear();
        });
        // Send mutiple keys simultaneously has random behavior
        // Perhaps keys are entered when input does not have the focus
        // So comment all tests
        // it('mutiple keys simultaneously 1', async function () {
        //     await checkTextToSearch('');

        //     await mmi.textToSearch.sendKeys("abcdefghijklm");
        //     await sleepMs(100);
        //     // KO with sleepMs(100): abcd
        //     await checkTextToSearch('abcdefghijklm');

        //     await mmi.textToSearch.sendKeys("123456");
        //     await sleepMs(100);
        //     // KO with sleepMs(100): abcdefghijklm1234
        //     await checkTextToSearch('abcdefghijklm123456');

        //     await mmi.textToSearch.clear();
        // });
        // it('mutiple keys simultaneously 2', async function () {
        //     await checkTextToSearch('');

        //     await mmi.textToSearch.sendKeys("abcdefghi");
        //     await sleepMs(100);
        //     // KO without sleepMs:   abc
        //     // KO with sleepMs(100): abcdabcdefgh
        //     await checkTextToSearch('abcdefghi');

        //     await mmi.textToSearch.sendKeys("123456");
        //     await sleepMs(100);
        //     // KO with sleepMs(100): abcdefghijklm12ab123
        //     await checkTextToSearch('abcdefghi123456');

        //     await mmi.textToSearch.clear();
        // });
        // it('mutiple keys 3', async function () {
        //     await checkTextToSearch('');

        //     await mmi.textToSearch.sendKeys("abcdefghijklm");
        //     await sleepMs(100);
        //     // KO without sleepMs:   abcabc
        //     // KO with sleepMs(100): abcdabcdefghabc
        //     // KO with sleepMs(100): abcde
        //     await checkTextToSearch('abcdefghijklm');

        //     await mmi.textToSearch.sendKeys("123");
        //     await sleepMs(100);
        //     // KO with sleepMs(100): abcdefghijklm12ab123abc123
        //     await checkTextToSearch('abcdefghijklm123');

        //     await mmi.textToSearch.clear();
        // });
    });

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    filesToIdArray.forEach((filesToId) => {
        describe(`${filesToId}`, async function () {
            this.timeout(8000);
            let filesTo: FilesTo;
            let cppElt: EditableCheckbox | null = null;
            let jsElt: EditableCheckbox | null = null;
            let javaElt: EditableCheckbox | null = null;

            before(async function () {
                filesTo = retrieveFilesToById(filesToId);
            });

            it('Check initial state', async function () {
                await filesTo.checkInitialState();
            });
            it('add item 1', async function () {
                cppElt = await filesTo.addNewCheckbox("*.cpp,*.cxx,*.h,*.hpp,*.hxx");
            });
            it('select so files appear in sidebar', async function () {
                await filesTo.selectAll();
                await sideBar.checkSearchSelectFiles();
            });
            it('add item 2', async function () {
                jsElt = await filesTo.addNewCheckbox("*.js");
            });
            it('add item 3', async function () {
                await filesTo.selectAll();
                javaElt = await filesTo.addNewCheckbox("*.java,*.js");
            });
            // it('add item double possible', async function () {
            //     ["*.cpp,*.cxx,*.h,*.hpp,*.hxx", "*.js", "*.java,*.js"].forEach(async (label) => {
            //         const doubleElt = await filesTo.addNewCheckbox(label);
            //         await filesTo.remove(doubleElt!, false);
            //     });
            //     // KO
            //     // 3 elements are still visible ???
            //     // - The 2 last are empty ???
            //     // - The 1st contains the 3 labels concatenated ??? 
            // });
            it('add item double possible', async function () {
                const doubleElt1 = await filesTo.addNewCheckbox("*.cpp,*.cxx,*.h,*.hpp,*.hxx");
                await filesTo.remove(doubleElt1, false);
                const doubleElt2 = await filesTo.addNewCheckbox("*.js");
                const doubleElt3 = await filesTo.addNewCheckbox("*.java,*.js");
                await filesTo.remove(doubleElt2, false);
                await filesTo.remove(doubleElt3, false);
            });
            it('select item, so all selected', async function () {
                await filesTo.select(javaElt!, true);
            });
            it('unselect item', async function () {
                await filesTo.unselect(jsElt!);
            });
            it('remove item, not all selected', async function () {
                await filesTo.remove(cppElt!, false);
                cppElt = null;
            });
            it('remove item, so all selected', async function () {
                await filesTo.remove(jsElt!, true);
                jsElt = null;
            });
            it('add item js again', async function () {
                jsElt = await filesTo.addNewCheckbox("*.js");
            });
            it('add item ~cpp again', async function () {
                cppElt = await filesTo.addNewCheckbox("*.cpp,*.cxx,*.h");
            });
            it('select/unselect all', async function () {
                await filesTo.selectAll();
                await filesTo.unselectAll();
            });
            it('edit item cpp', async function () {
                cppElt!.label.label.sendKeys(",*.hpp,*.hxx");
                cppElt!.label.expected.label = "*.cpp,*.cxx,*.h,*.hpp,*.hxx";
                await cppElt!.check();
                await filesTo.check();
            });
            it('select item cpp', async function () {
                await filesTo.select(cppElt!, false);
            });
            it('go back to initial state', async function () {
                await filesTo.remove(cppElt!,  false);  cppElt = null;
                await filesTo.remove(javaElt!, false);  javaElt = null;
                await filesTo.remove(jsElt!,   false);  jsElt = null;
            });
            it('Check initial state', async function () {
                await filesTo.checkInitialState();
            });
        });
    });

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    describe('save / restore', async function () {
        it('change state before close', async function () {
            this.timeout(20000);

            await mmi.cases.unselectById(mmi.cases.pascal.id);
            await mmi.sensitiveCase.click();
            const expected: string = "123abc";
            for (const char of expected) {
                await mmi.textToSearch.sendKeys(char);
            }
            await mmi.word.beginSelect();
            await sideBar.checkSearch();

            {
                const jsElt = await mmi.filesToInclude.addNewCheckbox("*.js");
                const javaElt = await mmi.filesToInclude.addNewCheckbox("*.java,*.js");
                await mmi.filesToInclude.remove(mmi.filesToInclude.retrieveByLabel("*.js,*.ts"), false);
                const javaRealElt = mmi.filesToInclude.retrieveByLabel("*.java,*.kt");
                await mmi.filesToInclude.select(javaRealElt, false);

                const cppElt = await mmi.filesToInclude.addNewCheckbox("*.c");
                await cppElt.label.label.sendKeys(",*.h");
                cppElt.label.expected.label = "*.c,*.h";
                await cppElt.check();

                // order is ..., javaReal, ..., cpp, js, java
                await mmi.filesToInclude.dragAndDrop(cppElt, javaRealElt);  // becomes ..., cpp, javaReal, ..., js, java
                await mmi.filesToInclude.dragAndDrop(javaRealElt, cppElt);  // becomes ..., javaReal, cpp, ..., js, java
                await mmi.filesToInclude.select(cppElt, false);
            }
            {
                const javaElt = await mmi.filesToExclude.addNewCheckbox("*.java,*.js");
                await mmi.filesToExclude.select(javaElt, false);
                await mmi.filesToExclude.select(mmi.filesToExclude.retrieveByLabel("*.log,*.logs"), false);
            }
            await sideBar.checkSearchSelectFiles();
        });

        it('close / open', async function () {
            this.timeout(8000);
            await afterFunction();
            await beforeFunction(mmi, sideBar);
        });

        it('check restored state', async function () {
            await mmi.cases.check();
            await checkSensitiveCase(false);
            await checkTextToSearch('123abc');
            await mmi.word.check();
            await mmi.filesToInclude.check();
            await mmi.filesToInclude.checkOrder();
            await mmi.filesToExclude.check();
            await mmi.filesToExclude.checkOrder();
            // The sideBar is absolutely not modified
            await sideBar.checkSearchSelectFiles();
        });
    });

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    describe('save / restore with filesTo empty', async function () {
        it('change state before close', async function () {
            this.timeout(20000);
            await mmi.filesToInclude.removeAll();
            await mmi.filesToExclude.removeAll();
            await sideBar.checkCurrentState();
        });

        it('close / open', async function () {
            this.timeout(8000);
            await afterFunction();
            await beforeFunction(mmi, sideBar);
        });

        it('check restored state', async function () {
            await mmi.filesToInclude.check();
            await mmi.filesToInclude.checkOrder();
            await mmi.filesToExclude.check();
            await mmi.filesToExclude.checkOrder();
            // The sideBar is absolutely not modified
            await sideBar.checkCurrentState();
        });
    });
});
