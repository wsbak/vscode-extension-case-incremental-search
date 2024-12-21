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
        editable: boolean,
    };
    constructor(label: WebElement, labelExpected: string, editableExpected: boolean) {
        this.label = label;
        this.expected = {
            label: labelExpected,
            editable: editableExpected,
        };
    }
    async checkOnce() {
        expect(await this.label.getAttribute('type')).equals('text');
    }
    async check() {
        expect(await this.label.isDisplayed()).equals(true);
        expect(await this.label.isEnabled()).equals(this.expected.editable);
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
    public readonly label: EditableLabel;
    public readonly addButton: Button;
    constructor(label: WebElement, addButton: WebElement) {
        this.label = new EditableLabel(label, "", true);
        this.addButton = new Button(addButton, false);  // not enabled because label empty
    }
    async checkOnce() {
        await this.label.checkOnce();
        await this.addButton.checkOnce();
    }
    async checkInitialState() {
        expect(this.label.expected.label).equals("");
        expect(this.label.expected.editable).equals(true);
        expect(this.addButton.expected.enabled).equals(false);
        await this.check();
    }
    async check() {
        await this.label.check();
        await this.addButton.check();
    }
    async clear() {
        // this.label.label.clear() does not trigger input event, so the button is not disabled/greyed
        for (let counter = this.label.expected.label.length; counter > 0; --counter) {
            await this.label.label.sendKeys(Key.BACK_SPACE);
        }
        this.label.expected.label = "";
        this.addButton.expected.enabled = false;
        await this.check();
    }
    async add(label: string, clearBefore: boolean=true) {
        if (clearBefore) {
            await this.clear();
        }

        await this.label.label.sendKeys(label);
        this.label.expected.label += label;
        this.addButton.expected.enabled = true;
        await this.check();

        await this.addButton.button.click();
        // The label is untouched, so can not add it again
        this.addButton.expected.enabled = false;
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
    async restore(before: Checkbox) {
        this.expected.label = before.expected.label;
        this.expected.selected = before.expected.selected;
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

    static async new(view: WebView): Promise<Cases> {
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
        const elt = new Cases(all, kebab, camel, pascal, snake, upperSnake, capital, path);
        return elt;
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
        await this.all.check();
        for (const elt of this.elts) {
            await elt.check();
        }
    }
    async restore(before: Cases) {
        for (const elt of [this.all, ...this.elts]) {
            const beforeElt = before.retrieve(elt.id);
            elt.restore(beforeElt);
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

    static async new(view: WebView): Promise<Word> {
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
        const elt = new Word(whole, begin, end);
        return elt;
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
        await this.wholeCheckbox.check();
        await this.beginCheckbox.check();
        await this.endCheckbox.check();
    }
    async restore(before: Word) {
        await this.wholeCheckbox.restore(before.wholeCheckbox);
        await this.beginCheckbox.restore(before.beginCheckbox);
        await this.endCheckbox.restore(before.endCheckbox);
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
    public editButton: EditButton;
    public removeButton: Button;
    public readonly gripper: WebElement;
    public readonly expected: {
        selected: boolean,
    };

    static async new(view: WebView, id: string, subId: number, labelExpected: string): Promise<EditableCheckbox> {
        const eltMain = await view.findWebElement(By.id(`${id}-elt`));
        const label = new EditableLabel(await eltMain.findElement(By.id(`${id}-label`)), labelExpected, false);
        const editButton = new EditButton(await eltMain.findElement(By.id(`${id}-editElt`)));
        const removeButton = new Button(await eltMain.findElement(By.id(`${id}-removeElt`)));
        const gripper = await eltMain.findElement(By.className('codicon-gripper'));
        const elt = new EditableCheckbox(id,
                                        subId,
                                        label,
                                        await view.findWebElement(By.id(`${id}-checkbox`)),
                                        editButton,
                                        removeButton,
                                        gripper);
        return elt;
    }
    private constructor(id: string,
                subId: number,
                label: EditableLabel,
                checkbox: WebElement,
                editButton: EditButton,
                removeButton: Button,
                gripper: WebElement) {
        this.id = id;
        this.subId = subId;
        this.label = label;
        this.checkbox = checkbox;
        this.editButton = editButton;
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
        expect(await this.editButton.checkOnce());
        expect(await this.removeButton.checkOnce());
    }
    async check() {
        expect(await this.label.check());
        expect(await this.checkbox.isSelected()).equals(this.expected.selected);
        expect(await this.editButton.check());
        expect(await this.removeButton.check());
    };
    restore(before: EditableCheckbox) {
        this.expected.selected = before.expected.selected;
    }
}

class FilesTo {
    private readonly view: WebView;
    public  readonly id: string;
    public  readonly allCheckbox: Checkbox;
    public  readonly addEditableCheckbox: AddEditableCheckbox;
    private readonly elts: EditableCheckbox[] = [];

    static async new(view: WebView, id: string): Promise<FilesTo> {
        const all = new Checkbox(id,
                                 await view.findWebElement(By.id(`${id}-label`)),
                                 await view.findWebElement(By.id(`${id}-checkbox`)),
                                 "All",
                                 false);
        const add = new AddEditableCheckbox(await view.findWebElement(By.id(`${id}-addElt-label`)),
                                            await view.findWebElement(By.id(`${id}-addElt-apply`)));
        const elt = new FilesTo(view, id, all, add);
        return elt;
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
        expect(this.elts.length).equals(0);
        expect(this.allCheckbox.expected.selected).equals(false);
        await this.addEditableCheckbox.checkInitialState();
        await this.check();
        await this.checkOrder();
    }
    async check() {
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
    // label must not be empty or already exist, can not add, addButton disabled
    async addNewCheckbox(label: string, clearBefore: boolean=true): Promise<EditableCheckbox> {
        await this.addEditableCheckbox.add(label, clearBefore);

        // The new item is not selected, so all is automatically unselected
        this.allCheckbox.expected.selected = false;

        let max = -1;
        for (const elt of this.elts) {
            max = Math.max(max, elt.subId);
        }
        const eltSubId = max + 1;

        const elt = await EditableCheckbox.new(this.view, `${this.id}-${eltSubId}`, eltSubId, label);
        await elt.checkOnce();

        this.elts.push(elt);
        await this.check();
        return elt;
    }
    // Forbidden because empty or double
    async addNewCheckboxForbidden(label: string) {
        await this.addEditableCheckbox.label.label.clear();
        await this.addEditableCheckbox.label.label.sendKeys(label);
        this.addEditableCheckbox.label.expected.label = label;
        this.addEditableCheckbox.addButton.expected.enabled = false;
        // Check button is disabled
        await this.addEditableCheckbox.check();
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
        await elt.removeButton.button.click();

        this.elts.forEach((item, index) => {
            if(item.id === elt.id) {
                this.elts.splice(index, 1);
            }
        });
        this.allCheckbox.expected.selected = expectAllSelected;
        await this.check();
    }
    async editStart(elt: EditableCheckbox) {
        expect(elt.editButton.expected.label).equals(elt.editButton.editLabel);
        await elt.editButton.button.click();

        elt.editButton.expected.label = elt.editButton.validLabel;
        elt.label.expected.editable = true;
        await this.check();
    }
    async editValid(elt: EditableCheckbox, addEditableCheckboxEnabled: boolean) {
        expect(elt.editButton.expected.label).equals(elt.editButton.validLabel);
        await elt.editButton.button.click();

        elt.editButton.expected.label = elt.editButton.editLabel;
        elt.label.expected.editable = false;
        this.addEditableCheckbox.addButton.expected.enabled = addEditableCheckboxEnabled;
        await this.check();
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
    // Restore expected values as before
    async restore(before: FilesTo) {
        // addEditableCheckbox : nothing to restore

        let allSelected = true;
        for (const beforeElt of before.elts) {
            const elt = await EditableCheckbox.new(this.view, beforeElt.id, beforeElt.subId, beforeElt.label.expected.label);
            elt.restore(beforeElt);
            this.elts.push(elt);
            if (elt.expected.selected === false) {
                allSelected = false;
            }
        }
        this.allCheckbox.expected.selected = allSelected;
    }
    getSideBarTextExpected(): string {
        const selectedElts = this.elts.filter(elt => elt.expected.selected);
        return selectedElts.map(elt => elt.label.expected.label).join(',');
    }
}

enum SideBarStatus {
    SearchNone,
    SearchWithoutFiles,
    SearchWithFiles,
}
class SideBar {
    private readonly view: WebView;
    private readonly cases: Cases;
    private readonly sensitiveCase: WebElement;
    private readonly textToSearch: WebElement;
    private readonly word: Word;
    private readonly filesToInclude: FilesTo;
    private readonly filesToExclude: FilesTo;
    private          status: SideBarStatus = SideBarStatus.SearchNone;

    constructor(view: WebView,
                cases: Cases,
                sensitiveCase: WebElement,
                textToSearch: WebElement,
                word: Word,
                filesToInclude: FilesTo,
                filesToExclude: FilesTo) {
        this.view = view;
        this.cases = cases;
        this.sensitiveCase = sensitiveCase;
        this.textToSearch = textToSearch;
        this.word = word;
        this.filesToInclude = filesToInclude;
        this.filesToExclude = filesToExclude;
    }
    async checkFirstState() {
        expect(this.status).equals(SideBarStatus.SearchNone);
        await this.check();
    }
    async checkSearch() {
        if (this.status < SideBarStatus.SearchWithoutFiles) {
            this.status = SideBarStatus.SearchWithoutFiles;
        }
        await this.check();
    }
    async checkSearchSelectFiles() {
        if (this.status < SideBarStatus.SearchWithFiles) {
            this.status = SideBarStatus.SearchWithFiles;
        }
        await this.check();
    }
    private async check() {
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
        const textToSearch = await this.textToSearch.getAttribute("value");
        const isSensitiveCaseSelected = await this.sensitiveCase.isSelected();

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
        expect(wholeWordChecked).equals(this.word.wholeCheckbox.expected.selected &&
                                        this.cases.elts.every(elt => ! elt.expected.selected));

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
        expect(filesToIncludeText).equals(this.filesToInclude.getSideBarTextExpected());
        expect(filesToExcludeText).equals(this.filesToExclude.getSideBarTextExpected());
    }
    private async isButtonChecked(contentElt: WebElement, className: string): Promise<boolean> {
        const button: WebElement = await contentElt.findElement(By.className(className));
        const ariaChecked = await button.getAttribute('aria-checked');
        return ariaChecked === 'true';
    }
}

describe('WebViews', function () {

    let view: WebView;

    let cases: Cases;
    let sensitiveCase: WebElement;
    let textToSearch: WebElement;
    let word: Word;
    let filesToInclude: FilesTo;
    let filesToExclude: FilesTo;
    let sideBar: SideBar;

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
        await sleepMs(500);
        view = new WebView();
        await view.switchToFrame();

        cases             = await Cases.new(view);
        sensitiveCase     = await view.findWebElement(By.id('sensitive-case'));
        textToSearch      = await view.findWebElement(By.id('text-to-search'));
        word              = await Word.new(view);
        filesToInclude    = await FilesTo.new(view, 'filesToInclude');
        filesToExclude    = await FilesTo.new(view, 'filesToExclude');
        sideBar           = new SideBar(view, cases, sensitiveCase, textToSearch, word, filesToInclude, filesToExclude);
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
        for (const elt of [filesToInclude, filesToExclude]) {
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
            await cases.checkOnce();
        });

        it('sensitiveCase', async function () {
            expect(await sensitiveCase.getAttribute('type')).equals('checkbox');
        });

        it('textToSearch', async function () {
            expect(await textToSearch.getAttribute('type')).equals('text');
        });

        it('words', async function () {
            await word.checkOnce();
        });

        it('filesTo', async function () {
            await filesToInclude.checkOnce();
            await filesToExclude.checkOnce();
        });
    });

    // --------------------------------------------------------------------------------
    async function checkSensitiveCase(selected: boolean) {
        expect(await sensitiveCase.isDisplayed()).equals(true);
        expect(await sensitiveCase.isEnabled()).equals(true);
        expect(await sensitiveCase.isSelected()).equals(selected);
    };

    async function checkTextToSearch(text: string) {
        expect(await textToSearch.isDisplayed()).equals(true);
        expect(await textToSearch.isEnabled()).equals(true);
        expect(await textToSearch.getAttribute("value")).equals(text);
    };

    // --------------------------------------------------------------------------------
    async function checkInitialState() {
        await cases.checkInitialState();
        await checkSensitiveCase(true);
        await checkTextToSearch('');
        await word.checkInitialState();
        await filesToInclude.checkInitialState();
        await filesToExclude.checkInitialState();
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
            await cases.unselectAll();
            await word.checkInitialState();
            await sideBar.checkSearch();  // check that regex is unselected
        });

        // --------------------------------------------------------------------------------
        it('select allCases', async function () {
            await cases.selectAll();
            await checkInitialState();
        });

        // --------------------------------------------------------------------------------
        caseIdArray.forEach((caseId) => {
            it(`unselect/select 1 case ${caseId}`, async function () {
                await cases.unselectById(caseId);
                await cases.selectById(caseId);
            });
        });

        // --------------------------------------------------------------------------------
        it('unselect allCases', async function () {
            await cases.unselectAll();
            await word.checkInitialState();
        });

        // --------------------------------------------------------------------------------
        caseIdArray.forEach((caseId) => {
            it(`select/unselect 1 case ${caseId}`, async function () {
                await cases.selectById(caseId);
                await cases.unselectById(caseId);
            });
        });

        // --------------------------------------------------------------------------------
        it('select allCases', async function () {
            await cases.selectAll();
            await checkInitialState();
        });
    });

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    describe('Begin/End/Whole Word', async function () {
        it('Whole Word', async function () {
            await word.wholeSelect();
            await sideBar.checkSearch();  // check that whole word is selected
            await word.wholeUnselect();
        });
        it('Begin Word', async function () {
            await word.beginSelect();
            await word.beginUnselect();
        });
        it('End Word', async function () {
            await word.endSelect();
            await word.endUnselect();
        });
        it('Begin + End Word select', async function () {
            await word.beginSelect();
            await word.endSelect();
        });
        it('Begin + End Word unselect', async function () {
            await word.beginUnselect();
            await word.endUnselect();
        });
        it('checkInitialState', async function () {
            await word.checkInitialState();
        });
    });

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    describe('sensitiveCase', async function () {

        it('Check initial state', async function () {
            await checkSensitiveCase(true);
        });
        it('select sensitiveCase', async function () {
            await sensitiveCase.click();
            await sideBar.checkSearch();  // check that sensitive case is unselected
            await checkSensitiveCase(false);
        });
        it('unselect sensitiveCase', async function () {
            await sensitiveCase.click();
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
                await textToSearch.sendKeys(char);
            }
            await checkTextToSearch(expected);
            await sideBar.checkSearch();

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

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------
    filesToIdArray.forEach((filesToId) => {
        describe(`${filesToId}`, async function () {
            let filesTo: FilesTo;
            let cppElt: EditableCheckbox | undefined = undefined;
            let jsElt: EditableCheckbox | undefined = undefined;
            let javaElt: EditableCheckbox | undefined = undefined;

            before(async function () {
                filesTo = retrieveFilesToById(filesToId);
            });

            it('Check initial state', async function () {
                await filesTo.checkInitialState();
            });
            it('add item empty forbidden', async function () {
                await filesTo.addNewCheckboxForbidden("");
            });
            it('add item 1', async function () {
                cppElt = await filesTo.addNewCheckbox("*.cpp,*.c,*.h");
            });
            it('select so files appear in sidebar', async function () {
                await filesTo.selectAll();
                await sideBar.checkSearchSelectFiles();
            });
            it('add item 2', async function () {
                jsElt = await filesTo.addNewCheckbox("*.js,*.ts");
            });
            it('add item 3', async function () {
                await filesTo.selectAll();
                javaElt = await filesTo.addNewCheckbox("*.java");
            });
            it('add item double forbidden', async function () {
                await filesTo.addNewCheckboxForbidden("*.cpp,*.c,*.h");
                await filesTo.addNewCheckboxForbidden("*.js,*.ts");
                await filesTo.addNewCheckboxForbidden("*.java");
            });
            it('select item, so all selected', async function () {
                await filesTo.select(javaElt!, true);
            });
            it('unselect item', async function () {
                await filesTo.unselect(jsElt!);
            });
            it('remove item, not all selected', async function () {
                await filesTo.remove(cppElt!, false);
                cppElt = undefined;
            });
            it('remove item, so all selected', async function () {
                await filesTo.remove(jsElt!, true);
                jsElt = undefined;
            });
            it('add item js again', async function () {
                jsElt = await filesTo.addNewCheckbox("*.js,*.ts");
            });
            it('add item ~cpp again', async function () {
                cppElt = await filesTo.addNewCheckbox("*.cpp,*.h");
            });
            it('select/unselect all', async function () {
                await filesTo.selectAll();
                await filesTo.unselectAll();
            });
            it('edit item cpp', async function () {
                await filesTo.editStart(cppElt!);

                cppElt!.label.label.sendKeys(",*.c");
                cppElt!.label.expected.label = "*.cpp,*.h,*.c";
                await cppElt!.check();

                await filesTo.editValid(cppElt!, true);
            });
            it('select item cpp', async function () {
                await filesTo.select(cppElt!, false);
            });
            it('go back to initial state', async function () {
                await filesTo.remove(cppElt!,  false);  cppElt = undefined;
                await filesTo.remove(javaElt!, false);  javaElt = undefined;
                await filesTo.remove(jsElt!,   false);  jsElt = undefined;
                await filesTo.addEditableCheckbox.clear();
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
            this.timeout(8000);

            await cases.unselectById(cases.pascal.id);
            await sensitiveCase.click();
            const expected: string = "123abc";
            for (const char of expected) {
                await textToSearch.sendKeys(char);
            }
            await word.beginSelect();
            await sideBar.checkSearch();

            {
                const jsElt = await filesToInclude.addNewCheckbox("*.js,*.ts");
                const javaElt = await filesToInclude.addNewCheckbox("*.java");

                const cppElt = await filesToInclude.addNewCheckbox("*.c");
                await filesToInclude.editStart(cppElt);
                await cppElt.label.label.sendKeys(",*.h");
                cppElt.label.expected.label = "*.c,*.h";
                await cppElt.check();

                filesToInclude.dragAndDrop(cppElt, jsElt);  // so order is cpp, js, java
                filesToInclude.dragAndDrop(jsElt, cppElt);  // so order is js, cpp, java
                await filesToInclude.select(cppElt, false);

                // no editValid on cppElt, so no save
                // so rollback expected.label (because xxx.restore fail to do it)
                cppElt.label.expected.label = "*.c";
            }
            {
                const javaElt = await filesToExclude.addNewCheckbox("*.java");
                await filesToExclude.select(javaElt, true);
            }
            await sideBar.checkSearchSelectFiles();
        });

        it('close / open', async function () {
            this.timeout(8000);
            await afterFunction();

            const casesSave = cases;
            const wordSave = word;
            const filesToIncludeSave = filesToInclude;
            const filesToExcludeSave = filesToExclude;
            await beforeFunction();
            await cases.restore(casesSave);
            await word.restore(wordSave);
            await filesToInclude.restore(filesToIncludeSave);
            await filesToExclude.restore(filesToExcludeSave);
        });

        it('check restored state', async function () {
            await cases.check();
            await checkSensitiveCase(false);
            await checkTextToSearch('123abc');
            await word.check();
            await filesToInclude.check();
            await filesToInclude.checkOrder();
            await filesToExclude.check();
            await filesToExclude.checkOrder();
            // The sideBar is absolutely not modifier
            await sideBar.checkSearchSelectFiles();
        });
    });
});
