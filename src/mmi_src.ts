
import * as vscode from 'vscode';
import type { ExtensionContext } from "vscode";
import { paramCase, camelCase, pascalCase, snakeCase, constantCase, capitalCase, pathCase } from "change-case";

type Message = { [key: string]: any };

class SrcCheckbox {
	public  readonly id: string;                             // id inside message and load/save into context
	private readonly checkboxLabelId: string;                // id inside message and load/save into context
    private readonly editable: boolean;                      // removeable + label is writeable (so saved and loaded)
    public           label: string;            // label of html checkbox
    // if null, no save/load, should be a main checkbox, recomputed by main.js
	private readonly srcDefaultValue: boolean | null;
	public           value: boolean | null;

    constructor(id: string,
                label: string | null,                     // null if editable and so, label saved and loaded
                defaultValue: boolean | null,             // null if value is not saved and loaded
                editable: boolean | null = null) {        // false if null
        this.id = id;
        this.checkboxLabelId = `${this.id}-label`;
        this.label = label !== null ? label : "";
        this.editable = editable === null ? false : editable;
        this.srcDefaultValue = defaultValue;
        this.value = defaultValue;
    }

    srcInit(context: ExtensionContext) {
        if (this.srcDefaultValue === null) {
            console.log("srcInit this.srcDefaultValue === null, so value no initialized");
            return;
        }
        this.value = context.workspaceState.get<boolean>(this.id, this.srcDefaultValue);
        if (this.editable) {
            this.label = context.workspaceState.get<string>(this.checkboxLabelId, this.label);
        }
    }
    // remove: true to remove the value from context
    srcSaveStatus(context: ExtensionContext, remove: boolean = false) {
        if (this.value === null) {
            console.log("srcSaveStatus this.value === null");
            return;
        }
        context.workspaceState.update(this.id, remove ? undefined : this.value);
        if (this.editable) {
            context.workspaceState.update(this.checkboxLabelId, remove ? undefined : this.label);
        }
    }
    srcFromMessage(message: Message) {
        if (!(this.id in message)) {
            console.log(`srcFromMessage ${this.id} not in message`);
            return;
        }
        this.value = message[this.id];
        if (this.editable) {
            this.label = message[this.checkboxLabelId];
        }
    }
    getHtmls(): string[] {
        // Just a div containing data (media will dynamically create the real html) 
        const html = `<div id="${this.id}" label="${this.label}" value="${this.value}" editable="${this.editable}"></div>`;
        return [html];
    }
}

class SrcCheckboxManager {
    public  readonly id: string;
	public  readonly elts: SrcCheckbox[];
    private readonly editable: boolean;

	constructor(id: string, elts: SrcCheckbox[],
                editable: boolean = false,
                _autonomous: boolean = false) {
        this.id = id;
        this.elts = elts;           // can be empty until srcInit
        this.editable = editable;
    }

    srcInit(context: ExtensionContext) {
        const eltNames = context.workspaceState.get<string[]>(`${this.id}Elts`, []);
        console.log(this.id, "srcInit", eltNames, "this.elts.length", this.elts.length);

        if (this.elts.length === 0) {
            // Elts are builded/added dynamically
            for (const eltName of eltNames) {
                this.srcBuildAndAddElt(eltName, context);
            }
        }
        console.log(this.id, "srcInit", "this.elts.length", this.elts.length);

        for (const elt of this.elts) {
            elt.srcInit(context);
        }
    }
    srcBuildElt(_eltName: string, _context: ExtensionContext): SrcCheckbox | null {
        // Must override if needed
        return null;
    }
    srcBuildAndAddElt(eltName: string, context: ExtensionContext): SrcCheckbox | null {
        const elt = this.srcBuildElt(eltName, context);
        if (elt) {
            console.log(this.id, "srcBuildAndAddElt", eltName);
            this.elts.push(elt);
        }
        return elt;
    }
    srcSaveStatus(context: ExtensionContext) {
        const eltNames = [...this.elts].map(elt => elt.id);
        console.log("srcSaveStatus", eltNames);
        context.workspaceState.update(`${this.id}Elts`, eltNames);

        for (const elt of this.elts) {
            elt.srcSaveStatus(context);
        }
    }
    srcFromMessage(message: Message) {
        for (const elt of this.elts) {
            elt.srcFromMessage(message);
        }
    }
    srcManageManagerMessage(message: Message, context: ExtensionContext) {
        console.log(this.id, `srcManageManagerMessage ${message.command}`, message);
        switch (message.command) {
            case 'exec':
                this.srcFromMessage(message);
                this.srcSaveStatus(context);
                return;

            case 'add':
                const elt = this.srcBuildAndAddElt(message.eltIdToAdd, context)!;
                elt.srcFromMessage(message);
                this.srcSaveStatus(context);
                return;

            case 'mod':
                for (const elt of this.elts) {
                    if (elt.id === message.eltId) {
                        elt.srcFromMessage(message);
                        this.srcSaveStatus(context);
                        return;
                    }
                }
                console.error(`mod elt ${message.eltId} not found !!!`);
                return;

            case 'remove':
                for (const elt of this.elts) {
                    if (elt.id in message) {
                        // Remove elt from this
                        const index = this.elts.indexOf(elt, 0);
                        console.log("srcManageManagerMessage remove index", index);
                        elt.srcSaveStatus(context, /*remove*/true);
                        this.elts.splice(index, 1);

                        this.srcSaveStatus(context);
                        return;
                    }
                }
                console.error(`No elt to remove in`, message);
                return;

            case 'list-order':
                console.log("srcManageManagerMessage list", message.eltIds);
                context.workspaceState.update(`${this.id}Elts`, message.eltIds);
                // but srcSaveStatus will not care
                // so must re-order this.elts
                const eltsOldOrder: SrcCheckbox[] = this.elts.concat();
                this.elts.length = 0;
                for (const id of message.eltIds) {
                    this.elts.push(eltsOldOrder.filter(elt => elt.id === id)[0]);
                }
                return;

            default:
                console.error(this.id, `srcManageManagerMessage ${message.command} ???`, message);
                return;
        }
    }
    srcGetHtml(): string {
        // Just a div containing data (media will dynamically create the real html) 
        let html = `<div id="${this.id}" editable="${this.editable}">`;
        for (const elt of this.elts) {
            for (const eltHtml of elt.getHtmls()) {
                html += eltHtml;
            }
        }
        html += `</div>`;
        return html;
    }
}

type CaseFunction = (input: string, ) => string;
type ConvertFctSeparator = [CaseFunction, string];  // Convert function + their separator

export class SrcCaseCheckbox extends SrcCheckbox {
	public readonly convertFctData: ConvertFctSeparator;

    constructor(id: string, label: string, defaultValue: boolean | null, caseFunction: CaseFunction, caseSeparator: string) {
        super(id, label, defaultValue);
        this.convertFctData = [caseFunction, caseSeparator];
    }
}

export class SrcCaseManager extends SrcCheckboxManager {
	public readonly kebab     : SrcCaseCheckbox;
	public readonly camel     : SrcCaseCheckbox;
	public readonly pascal    : SrcCaseCheckbox;
	public readonly snake     : SrcCaseCheckbox;
	public readonly upperSnake: SrcCaseCheckbox;
	public readonly capital   : SrcCaseCheckbox;
	public readonly path      : SrcCaseCheckbox;

	constructor() {
        const kebab      = new SrcCaseCheckbox('kebabCase',      'kebab-case',       true, paramCase,    "-");
        const camel      = new SrcCaseCheckbox('camelCase',      'camelCase',        true, camelCase,    "");
        const pascal     = new SrcCaseCheckbox('pascalCase',     'PascalCase',       true, pascalCase,   "");
        const snake      = new SrcCaseCheckbox('snakeCase',      'snake_case',       true, snakeCase,    "_");
        const upperSnake = new SrcCaseCheckbox('upperSnakeCase', 'UPPER_SNAKE_CASE', true, constantCase, "_");
        const capital    = new SrcCaseCheckbox('capitalCase',    'Capital Case',     true, capitalCase,  " ");
        const path       = new SrcCaseCheckbox('pathCase',       'path/case',        true, pathCase,     "/");

        const elts = [
            kebab,
            camel,
            pascal,
            snake,
            upperSnake,
            capital,
            path,
        ];
        super("case", elts);

        this.kebab         = kebab;
        this.camel         = camel;
        this.pascal        = pascal;
        this.snake         = snake;
        this.upperSnake    = upperSnake;
        this.capital       = capital;
        this.path          = path;
    }

    srcGetSelectedCaseFunctions(message: Message): ConvertFctSeparator[] {
        const selectedCaseFunctions: ConvertFctSeparator[] = [];
        for (const elt of this.elts) {
            if (message[elt.id]) {
                selectedCaseFunctions.push((elt as SrcCaseCheckbox).convertFctData);
            }
        }
        return selectedCaseFunctions;
    }
}

export class SrcWordManager extends SrcCheckboxManager {
    constructor() {
        const beginWord = new SrcCheckbox('beginWord', 'Begin word', false);
        const endWord   = new SrcCheckbox('endWord',   'End word',   false);
    
        const elts = [
            beginWord,
            endWord,
        ];
        super("word", elts);
    }
}

export class SrcFilesToManager extends SrcCheckboxManager {
    constructor(id: string) {
        super(id, [], true, true);
    }

    srcBuildElt(eltName: string, _context: ExtensionContext): SrcCheckbox | null {
        console.log("srcBuildElt returns new SrcCheckbox", eltName);
        return new SrcCheckbox(eltName, null, false, true);
    }
    srcManageManagerMessage(message: Message, context: ExtensionContext) {
        console.log(this.id, "srcManageManagerMessage", "message.command", message.command);

        const stopAfterParent = this.srcManageManagerMessageMustStopAfterParent(message);
        super.srcManageManagerMessage(message, context);
        if (stopAfterParent) {
            return;
        }

        switch (message.command) {
            case 'exec':
            case 'mod':
            case 'remove':
                const params: { [key: string]: any } = {
                    triggerSearch: true,
                    showIncludesExcludes: true,
                };
                params[this.id] = this.srcComputeFilesTo();
                vscode.commands.executeCommand("workbench.action.findInFiles", params);
                return;
        }
    }
    private srcManageManagerMessageMustStopAfterParent(message: Message): boolean {
        if (message.command === 'remove' ||
            message.command === 'mod') {
            for (const elt of this.elts) {
                if (elt.id in message) {
                    if (elt.value === false) {
                        // Elt is not selected, so no need to trigger search
                        console.log(this.id, `srcManageManagerMessageMustStopAfterParent ${message.command} elt found, not selected`);
                        return true;
                    }
                    console.log(this.id, `srcManageManagerMessageMustStopAfterParent ${message.command} elt found, selected`);
                    return false;
                }
            }
            console.error(this.id, `srcManageManagerMessageMustStopAfterParent ${message.command} elt not found !!!`);
        }
        return false;
    }
    private srcComputeFilesTo(): string {
        console.log("srcComputeFilesTo");
        const filesTo: string[] = [];
        for (const elt of this.elts) {
            if (elt.value) {
                filesTo.push(elt.label);
            }
        }
        const filesToStr = filesTo.join(',');
        console.log("filesToStr", filesToStr);
        return filesToStr;
    }
}

export class SrcFilesToIncludeManager extends SrcFilesToManager {
    constructor() {
        super("filesToInclude");  // workbench.action.findInFiles argument name
    }
}

export class SrcFilesToExcludeManager extends SrcFilesToManager {
    constructor() {
        super("filesToExclude");  // workbench.action.findInFiles argument name
    }
}

// Defines some parts of the mmi
export class SrcMmi {
    public readonly caseManager: SrcCaseManager;
    public readonly wordManager: SrcWordManager;
    public readonly filesToIncludeManager: SrcFilesToIncludeManager;
    public readonly filesToExcludeManager: SrcFilesToExcludeManager;
    public readonly managers: SrcCheckboxManager[];
    private readonly mainManagers: SrcCheckboxManager[];
    private readonly otherManagers: SrcCheckboxManager[];

	constructor() {
        this.caseManager           = new SrcCaseManager();
        this.wordManager           = new SrcWordManager();
        this.filesToIncludeManager = new SrcFilesToIncludeManager();
        this.filesToExcludeManager = new SrcFilesToExcludeManager();
        this.mainManagers  = [this.caseManager, this.wordManager];
        this.otherManagers = [this.filesToIncludeManager, this.filesToExcludeManager];
        this.managers      = this.mainManagers.concat(this.otherManagers);
    }

    srcInit(context: ExtensionContext) {
        for (const manager of this.managers) {
            manager.srcInit(context);
        }
    }
    srcFromMainMessage(message: Message, context: ExtensionContext) {
        for (const manager of this.mainManagers) {
            manager.srcFromMessage(message);
            manager.srcSaveStatus(context);
        }
    }
    srcManageManagerMessage(message: Message, context: ExtensionContext) {
        if (!('manager' in message)) {
            console.error("srcManageManagerMessage manager not in", message);
            return;
        }

        const managerId = message.manager;
        for (const manager of this.otherManagers) {
            if (manager.id === managerId) {
                manager.srcManageManagerMessage(message, context);
                manager.srcSaveStatus(context);
                return;
            }
        }

        console.error("srcManageManagerMessage manager", managerId, " not found");
    }
}
