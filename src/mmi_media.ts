
// .js file is generated by npm scripts compile/watch/compile-tests/... :
// Do not modify .js file




class DraggableTable {
    private tableId: string;
    private table: HTMLElement;
    private tbody: HTMLElement;
    private onRowDropped: (rowDropped: Element) => void;
    private currRow: Element | null;
    private dragElem: HTMLElement | null;
    private mouseDownX: number;
    private mouseDownY: number;
    private mouseX: number;
    private mouseY: number;
    private mouseDrag: boolean;
    
    constructor(tableId: string, onRowDropped: (rowDropped: Element) => void) {
        this.tableId = tableId;
        this.table = document.getElementById(tableId)!;
        this.tbody = this.table.querySelector('tbody')!;
        this.onRowDropped = onRowDropped;
        this.currRow = null;
        this.dragElem = null;
        this.mouseDownX = 0;
        this.mouseDownY = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDrag = false;

        this.bindMouse();
    }

    bindMouse() {
        // console.log(this.tableId, "bindMouse");

        document.addEventListener('mousedown', (event) => {
            // console.log(this.tableId, "mousedown");
            if(event.button !== 0) {
                // console.log(this.tableId, "event.button", event.button);
                return true;
            }

            const target = this.getTargetRow(event.target);
            if(target) {
                this.currRow = target;
                this.addDraggableRow(target);
                this.currRow!.classList.add('is-dragging');

                const coords = this.getMouseCoords(event);
                this.mouseDownX = coords.x;
                this.mouseDownY = coords.y;      

                this.mouseDrag = true;
                // console.log(this.tableId, "mousedown", "this.mouseDownX", this.mouseDownX, "this.mouseDownY", this.mouseDownY);
            }
            return true;
        });

        document.addEventListener('mousemove', (event) => {
            if(!this.mouseDrag) {
                // console.log(this.tableId, "mousemove", "no mouseDrag");
                return;
            }
            // console.log(this.tableId, "mousemove");

            const coords = this.getMouseCoords(event);
            this.mouseX = coords.x - this.mouseDownX;
            this.mouseY = coords.y - this.mouseDownY;  

            this.moveRow(this.mouseX, this.mouseY);
        });

        document.addEventListener('mouseup', (_event) => {
            if(!this.mouseDrag) {
                return;
            }
            // console.log(this.tableId, "mouseup");

            this.currRow!.classList.remove('is-dragging');
            this.table.removeChild(this.dragElem!);

            this.dragElem = null;
            this.mouseDrag = false;

            this.onRowDropped(this.currRow!);
        });    
    }

    swapRow(row: any, index: number) {
        const currIndex = Array.from(this.tbody.children).indexOf(this.currRow!);
        const row1 = currIndex > index ? this.currRow : row;
        const row2 = currIndex > index ? row : this.currRow;

        this.tbody.insertBefore(row1, row2);
    }

    moveRow(x: number, y: number) {
        this.dragElem!.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";

        const	dragElemPos = this.dragElem!.getBoundingClientRect();
        const currStartY = dragElemPos.y;
        const currEndY = currStartY + dragElemPos.height;
        const rows = this.getRows();

        for(var i = 0; i < rows.length; i++) {
            const rowElem = rows[i];
            const rowSize = rowElem.getBoundingClientRect();
            const rowStartY = rowSize.y, rowEndY = rowStartY + rowSize.height;

            if(this.currRow !== rowElem && this.isIntersecting(currStartY, currEndY, rowStartY, rowEndY)) {
                if(Math.abs(currStartY - rowStartY) < rowSize.height / 2) {
                    this.swapRow(rowElem, i);
                }
            }
        }    
    }

    addDraggableRow(target: any) {
        this.dragElem = target.cloneNode(true);
        this.dragElem!.classList.add('draggable-table__drag');
        this.dragElem!.style.height = this.getStyle(target, 'height');
        this.dragElem!.style.background = this.getStyle(target, 'backgroundColor');

        const td = this.dragElem!.querySelectorAll('.draggable-handler')[0] as HTMLElement;
        td.style.cursor = "grabbing";

        for(var i = 0; i < target.children.length; i++) {
            const oldTD = target.children[i];
            const newTD = this.dragElem!.children[i] as HTMLElement;
            newTD.style.width = this.getStyle(oldTD, 'width');
            newTD.style.height = this.getStyle(oldTD, 'height');
            newTD.style.padding = this.getStyle(oldTD, 'padding');
            newTD.style.margin = this.getStyle(oldTD, 'margin');
        }      

        this.table.appendChild(this.dragElem!);

        const targetPos = target.getBoundingClientRect();
        const dragElemPos = this.dragElem!.getBoundingClientRect();
        // console.log(this.tableId, 'addDraggableRow', 'targetPos', targetPos, 'dragElemPos', dragElemPos);
        this.dragElem!.style.bottom = (dragElemPos.y - targetPos.y) + "px";
        this.dragElem!.style.left = "-1px";
        // console.log(this.tableId, 'addDraggableRow', 'dragElem.style.bottom', this.dragElem!.style.bottom);

        document.dispatchEvent(new MouseEvent('mousemove',
            { view: window, cancelable: true, bubbles: true }
        ));    
    }  

    // Return all rows containing a td with draggable-handler class
    getRows(): Element[] {
        const rows = this.table.querySelectorAll('tbody tr');
        const draggableRows = Array.from(rows).filter(row => row.querySelector('td.draggable-handler'));
        return draggableRows;
    }    

    // Return the row containing the target 
    getTargetRow(target: any): Element | null {
        if(target.classList.contains('draggable-handler')) {
            const row: Element = target.closest('tr')!;
            if(this.table?.contains(row)) {
                // console.log(this.tableId, 'draggable-handler found inside table');
                return row;
            }
        }
        return null;
    }

    getMouseCoords(event: any) {
        return {
            x: event.clientX,
            y: event.clientY
        };    
    }  

    getStyle(target: Element, styleName: any): any | null {
        const compStyle = getComputedStyle(target);
        const style = compStyle[styleName];

        return style ? style : null;
    }  

    isIntersecting(min0: number, max0: number, min1: number, max1: number) {
        return Math.max(min0, max0) >= Math.min(min1, max1) &&
               Math.min(min0, max0) <= Math.max(min1, max1);
    }  
}
  







type Message = { [key: string]: any };

let mediaSendMessage: ((message: Message) => void) | null = null;

class MediaCheckbox {
	public  readonly id: string;                             // id inside message and load/save into context
	private readonly checkboxId: string;                     // id inside html
	private readonly checkboxLabelId: string;                // id inside html
	private readonly editEltId: string;
	private readonly removeEltId: string;
    public  readonly editable: boolean;                      // removeable + label is writeable (so saved and loaded)
    public           htmlClasses: string = "";
    public           label: string;            // label of html checkbox
    // if null, no save/load, should be a main checkbox, recomputed by main.js
	public           value: boolean | null;
    public           htmlCheckbox: HTMLInputElement | null;        // element <checkboxId> from document
    public           htmlEditable: {          // only if editable
        htmlCheckboxLabel: HTMLInputElement,  // element <checkboxLabelId> from document
        editButton: HTMLButtonElement;        // element <editEltId> from document
        removeButton: HTMLButtonElement;      // element <removeEltId> from document
    } | null = null;                          // never null after mediaInit IF editable

    constructor(id: string,
                label: string,
                value: boolean | null,                    // null if value is unknown
                editable: boolean) {
        this.id = id;
        this.checkboxId = `${this.id}-checkbox`;
        this.checkboxLabelId = `${this.id}-label`;
        this.editEltId = `${this.id}-editElt`;
        this.removeEltId = `${this.id}-removeElt`;
        this.editable = editable;
        this.label = label;
        this.value = value;
        this.htmlCheckbox = null;  // never null after mediaInit
        this.htmlEditable = null;  // never null after mediaInit IF editable
    }
    mediaInit() {
        this.htmlCheckbox = document.getElementById(this.checkboxId) as HTMLInputElement;
        if (this.editable) {
            this.htmlEditable = {
                htmlCheckboxLabel: document.getElementById(this.checkboxLabelId) as HTMLInputElement,
                editButton: document.getElementById(this.editEltId) as HTMLButtonElement,
                removeButton: document.getElementById(this.removeEltId) as HTMLButtonElement,
            };
        }
    }
    mediaAddEventListener(method: any) {
        this.htmlCheckbox!.addEventListener('input', (event: any) => { method(event); });
    }
    mediaAddEventListenerEdit(method: any) {
        this.htmlEditable!.editButton!.addEventListener('click', () => {
            // console.log("media.editButton input");
            const editLabel = '\u{1F527}';   // "&#128295;"
            const validLabel = '\u{2714}';   // "&#10004;"
            let valid = false;
            if (this.htmlEditable!.editButton!.textContent === editLabel) {
                this.htmlEditable!.editButton!.textContent = validLabel;
                valid = false;
            }
            else {
                this.htmlEditable!.editButton!.textContent = editLabel;
                valid = true;
            }
            method(this, valid);
        });
    }
    mediaAddEventListenerRemove(method: any) {
        this.htmlEditable!.removeButton!.addEventListener('click', () => {
            // console.log("media.removeButton input");
            method(this);
        });
    }
    mediaUpdateMessage(message: Message) {
        message[this.id] = this.htmlCheckbox!.checked;
        message[this.checkboxLabelId] = this.label;
        // console.log(this.id, `mediaUpdateMessage message[${this.id}]`, message[this.id], `message[${this.checkboxLabelId}]`, message[this.checkboxLabelId]);
    }
    mediaEditStart() {
        const ie = document.getElementById(`${this.checkboxLabelId}`) as HTMLInputElement;
        ie.removeAttribute("disabled");
    }
    mediaEditValid(managerId: string) {
        const ie = document.getElementById(`${this.checkboxLabelId}`) as HTMLInputElement;
        ie.setAttribute("disabled", "none");

        // Save
        this.label = this.htmlEditable!.htmlCheckboxLabel!.value!;
        // console.log("mediaEditValid", "this.label", this.label);

        // Send mod message
        const message: Message = {
            manager: managerId,
            command: 'mod',
            eltId: this.id,
        };
        this.mediaUpdateMessage(message);
        // console.log("mediaEditValid mediaSendMessage", message);
        mediaSendMessage!(message);
    }

    getHtmls(): string[] {
        const classDecl = this.htmlClasses !== '' ? `class="${this.htmlClasses}"` : '';
        const state = this.value ? "checked" : "";
        const labelHtml = this.editable ?
            `<input for="${this.checkboxId}" id="${this.checkboxLabelId}" type="text" value="${this.label}" class="input-as-label" disabled/>` : 
            `<label for="${this.checkboxId}" id="${this.checkboxLabelId}">${this.label}</label>`;

        const html = `<div class="container">
                      <input type="checkbox" ${state} id="${this.checkboxId}" ${classDecl} />
                      ${labelHtml}
                      </div>`;
        // TODO click on input this.checkboxLabelId does NOT change this.checkboxId (as it does for a label)
        const htmls = [html];
        if (this.editable) {
            // edit button
            htmls.push(
            // `<button id="${this.editEltId}">&#9997;</button>`,
            // `<button id="${this.editEltId}">&#9998;</button>`,
            // `<button id="${this.editEltId}">&#128275;</button>`,
            `<button id="${this.editEltId}">&#128295;</button>`,
            // `<button id="${this.editEltId}">&#128393;</button>`,
            // // `<button id="${this.editEltId}">&#128394;</button>`,
            // // `<button id="${this.editEltId}">&#128395;</button>`,
            // // `<button id="${this.editEltId}">&#128396;</button>`,
            // `<button id="${this.editEltId}">&#128397;</button>`,

            // // Valid
            // // `<button id="${this.editEltId}">&#10003;</button>`,
            // `<button id="${this.editEltId}">&#10004;</button>`,
            // // `<button id="${this.editEltId}">&#9745;</button>`,
            // // `<button id="${this.editEltId}">&#9166;</button>`,
            // // `<button id="${this.editEltId}">&#9989;</button>`,

            );
            // remove button
            htmls.push(`<button id="${this.removeEltId}">&#10134;</button>`);

            // drag&drop
            htmls.push("=");
        }
        return htmls;
    }
}

class MediaCheckboxManager {
    public  readonly id: string;
    public  readonly addEltId: string;
	private readonly mainElt: MediaCheckbox;  // All checkbox permits to select/unselect all elts
	public  readonly elts: MediaCheckbox[];
    private readonly autonomous: boolean;
    public  readonly htmlTable: boolean;
    private          eventListenerMethod: any;  // null until mediaAddEventListener, still null if autonomous
    public           editable: {                // only if editable
        addElt: MediaCheckboxAdd;
        draggableTable: DraggableTable;
    } | null = null;

	constructor(id: string,
                mainEltLabel: string,
                editable: boolean = false,
                autonomous: boolean = false) {
        this.id = id;
        this.addEltId = `${this.id}-addElt`;
        this.elts = [];
        this.autonomous = autonomous;
        this.htmlTable = editable;
        {
            // Elts are builded/added dynamically
            //  from div generated by src 
            const srcGroup = document.getElementById(this.id) as HTMLElement;

            // Create a table or a div and replace the srcGroup
            const newGroup: HTMLElement = document.createElement('div');
            newGroup.id = this.id;
            newGroup.innerHTML = this.mediaGetHtml();
            srcGroup.parentNode!.replaceChild(newGroup, srcGroup);

            // Add the All checkbox
            this.mainElt = this.mediaAddNewChildNoMessage(id, "Main", mainEltLabel, false, false);

            // Add all elements as specified into srcGroup
            const descendants = srcGroup.getElementsByTagName("*");
            for (const idx in descendants) {
                const htmlElt = descendants[idx] as HTMLElement;
                if (! (htmlElt instanceof HTMLElement)) {
                    // console.log(this.id, `MediaCheckboxManager htmlElt`, htmlElt, "ignored");
                    continue;
                }
                const id = htmlElt.getAttribute("id")!;
                const label = htmlElt.getAttribute("label")!;
                const value = htmlElt.getAttribute("value")! === "true";
                const editable = htmlElt.getAttribute("editable")! === "true";
                // console.log(this.id, `MediaCheckboxManager Elt ${label} ${value} ${editable}`, htmlElt);

                this.mediaAddNewChildNoMessage(id, "Elt",  label, value, editable);
            }
            if (editable) {
                this.editable = {
                    addElt: new MediaCheckboxAdd(this, this.addEltId),
                    draggableTable: new DraggableTable(`${id}-draggable-table`, (row) => this.mediaRowDropped(row)),
                };
                this.mediaAddNewChildHtml(this.addEltId, this.editable.addElt.getHtmls());
                this.editable.addElt.mediaInit();
                this.editable.addElt.mediaAddEventListener();
            }
        }
        this.mediaComputeMainCheckbox();
        this.eventListenerMethod = null;
    }
    mediaGetHtml(): string {
        let html = "";
        if (this.htmlTable) {
            html += `<table id="${this.id}-draggable-table" class="draggable-table">`;
            html += `<tbody>`;
            html += `</tbody>`;
            html += `</table>`;
        }
        return html;
    }
    mediaRowDropped(_row: Element) {
        // console.log(this.id, "mediaRowDropped", row);

        // Retrieve the new order of the rows
        const eltIds: string[] = [];
        {
            const srcGroup = document.getElementById(this.id) as HTMLElement;
            const descendants = srcGroup.getElementsByClassName("subCheckbox");
            for (const idx in descendants) {
                const htmlElt = descendants[idx] as HTMLElement;
                if (! (htmlElt instanceof HTMLElement)) {
                    // console.log(this.id, `MediaCheckboxManager htmlElt`, htmlElt, "ignored");
                    continue;
                }
                const id = htmlElt.getAttribute("id")!;
                eltIds.push(id.replace('-checkbox', ''));
            }
        }

        // Send list message
        const message: Message = {
            manager: `${this.id}`,
            command: 'list-order',
             eltIds: eltIds,
        };
        // console.log(this.id, "mediaRowDropped mediaSendMessage", message);
        mediaSendMessage!(message);

        // Sort this.elts is useless
    }
    mediaRemoveChild(elt: MediaCheckbox) {
        // console.log(this.id, "mediaRemoveChild", elt);

        // Send remove message
        const message: Message = {
            manager: `${this.id}`,
            command: 'remove',
        };
        message[elt.id] = true;
        // console.log(this.id, "mediaRemoveChild mediaSendMessage", message);
        mediaSendMessage!(message);

        // Remove html
        const eltHtml = document.getElementById( `${elt.id}-elt`)!;
        eltHtml.parentNode!.removeChild(eltHtml);
        
        // Remove elt from this
        const index = this.elts.indexOf(elt, 0);
        // console.log(this.id, "mediaRemoveChild index", index);
        this.elts.splice(index, 1);

        this.mediaComputeMainCheckbox();
        this.editable!.addElt.mediaUpdateBehavior();
    }
    mediaAddNewChild(label: string, value: boolean): MediaCheckbox {
        const eltId = this.mediaGenerateNewChildId();
        // console.log(this.id, "mediaAddNewChild", eltId);
        const elt = this.mediaAddNewChildNoMessage(eltId, "Elt", label, value, true);

        this.mediaComputeMainCheckbox();
        this.editable!.addElt.mediaUpdateBehavior();

        // Send add message
        const message: Message = {
            manager: `${this.id}`,
            command: 'add',
            eltIdToAdd: eltId,
        };
        elt.mediaUpdateMessage(message);
        // console.log(this.id, "mediaAddNewChild mediaSendMessage", message);
        mediaSendMessage!(message);

        return elt;
    }
    private mediaGenerateNewChildId(): string {
        let max = -1;
        for (const elt of this.elts) {
            const subIdStr = elt.id.split('-')[1];
            const subId: number = +subIdStr;
            max = Math.max(max, subId);
        }
        return `${this.id}-${max+1}`;
    }
    private mediaAddNewChildNoMessage(eltId: string, kind: string, label: string, value: boolean, editable: boolean): MediaCheckbox {
        // console.log(this.id, "mediaAddNewChildNoMessage", eltId);
        const elt = new MediaCheckbox(eltId, label, value, editable);
        if (kind === "Elt") {
            elt.htmlClasses = "subCheckbox";
        }
        const eltHtmls = elt.getHtmls();
        // console.log(this.id, "mediaAddNewChildNoMessage", eltId, eltHtmls);

        // Add html into document
        this.mediaAddNewChildHtml(kind === "Elt" ? `${eltId}-elt` : `${eltId}-mainElt`, eltHtmls);

        // Init new element from html
        elt.mediaInit();
        if (kind === "Elt") {
            this.elts.push(elt);
        }

        // Add listener
        this.mediaEltAddEventListener(elt);

        return elt;
    }
    private mediaAddNewChildHtml(eltId: string, eltHtmls: string[]) {
        // console.log(this.id, "mediaAddNewChildHtml", eltId, eltHtmls);

        // Add html into document
        const newRow: HTMLElement = document.createElement(this.htmlTable ? 'tr' : 'div');
        newRow.id = eltId;
        newRow.innerHTML = this.getHtmlEltRaw(eltId, eltHtmls);

        let parent = document.getElementById(this.id)!;
        if (this.htmlTable) {
            parent = parent.getElementsByTagName('tbody')[0];
        }

        if (parent.hasChildNodes() === false) {
            // 1st child, should be main checkbox
            parent.insertBefore(newRow, null);
        }
        else {
            // not 1st child, should be elt checkbox or add checkbox
            const rowBeforeId = this.elts.length > 0 ? `${this.elts.at(-1)!.id}-elt` : `${this.mainElt.id}-mainElt`;
            const rowBefore = document.getElementById(rowBeforeId)!;
            // console.log(`rowBeforeId=${rowBeforeId} rowBefore=${rowBefore}`);
            rowBefore.parentNode!.insertBefore(newRow, rowBefore.nextSibling);
        }
    }
    mediaEltAddEventListener(elt: MediaCheckbox) {
        elt.mediaAddEventListener((event: any) => { this.mediaEventListenerInnerMethod(event); });
        if (elt.editable) {
            elt.mediaAddEventListenerEdit((_elt: MediaCheckbox, valid: boolean) => {
                // console.log(this.id, "mediaAddEventListenerEdit", elt.id, valid ? "valid" : "edit");
                if (valid) {
                    elt.mediaEditValid(this.id);
                    this.editable!.addElt.mediaUpdateBehavior();
                }
                else {
                    elt.mediaEditStart();
                }
            });
           elt.mediaAddEventListenerRemove((_elt: MediaCheckbox) => {
                this.mediaRemoveChild(elt);
            });
        }
    }
    mediaAddEventListener(method: any) {
        this.eventListenerMethod = method;
        // eventListeners already setted
    }
    private mediaEventListenerInnerMethod(event: any) {
        this.mediaManage(event);

        if (this.eventListenerMethod) {
            // console.log(this.id, "mediaAddEventListenerInner callback call method");
            this.eventListenerMethod(event);
        }
        else {
            // console.log(this.id, "mediaAddEventListenerInner callback call mediaBuildMessage");
            const message = this.mediaBuildMessage();
            mediaSendMessage!(message);
        }
    }
    mediaUpdateMessage(message: Message) {
        if (this.autonomous) {
            console.error(this.id, "mediaUpdateMessage must not be called if autonomous");
        }

        for (const elt of this.elts) {
            elt.mediaUpdateMessage(message);
        }
    }
    private mediaBuildMessage(): {} {
        if (!this.autonomous) {
            console.error(this.id, "mediaBuildMessage must not be called if not autonomous");
        }

        const message = {
            manager: `${this.id}`,
            command: 'exec',
        };

        for (const elt of this.elts) {
            elt.mediaUpdateMessage(message);
        }
        return message;
    }

    private mediaManage(event: any) {
        if (this.mainElt.htmlCheckbox === event.target) {
            // Change all subCheckboxes
            for (const elt of this.elts) {
                if (elt.htmlCheckbox) {
                    elt.htmlCheckbox.checked = event.target?.checked;
                }
            }
            return;
        }

        for (const elt of this.elts) {
            if (elt.htmlCheckbox === event.target) {
                this.mediaComputeMainCheckbox();
                return;
            }
        }

        // Impossible
    }

    private mediaComputeMainCheckbox() {
        if (this.mainElt && this.mainElt.htmlCheckbox) {
            const allChecked = this.elts.length !== 0 && [...this.elts].every(elt => elt.htmlCheckbox!.checked);
            this.mainElt.htmlCheckbox.checked = allChecked;
        }
    }

    private getHtmlEltRaw(_eltId: string, eltHtmls: string[]): string {
        let html = "";
        if (this.htmlTable) {
            for (const eltHtml of eltHtmls) {
                if (eltHtml === "=") {
                    // &#8661;      https://www.w3schools.com/charsets/tryit.asp?deci=8661      large bold arrow
                    // &#8691;      https://www.w3schools.com/charsets/tryit.asp?deci=8691      large arrow
                    // &#8693;      https://www.w3schools.com/charsets/tryit.asp?deci=8693      double arrow
                    // &#8597;      https://www.w3schools.com/charsets/tryit.asp?deci=8597
                    // html += `<td class="draggable-handler">&#8597;</td>`;
                    html += `<td class="draggable-handler"><i class="codicon codicon-gripper draggable-handler"/></td>`;
                }
                else {
                    html += `<td>${eltHtml}</td>`;
                }
            }
        }
        else {
            for (const eltHtml of eltHtmls) {
                html += `<div>${eltHtml}</div>`;
            }
        }
        return html;
    }
}

export class MediaCaseManager extends MediaCheckboxManager {
	constructor() {
        super("case", 'All');
    }
}

export class MediaWordManager extends MediaCheckboxManager {
    constructor() {
        super("word", 'Whole word');
    }
}

export class MediaCheckboxAdd {
    private readonly manager: MediaCheckboxManager;
	private readonly id: string;                             // id inside message and load/save into context
    private readonly htmlLabelId: string;
    private readonly htmlApplyId: string;
    private          media: {
        label: HTMLInputElement,
        button: HTMLButtonElement;
    } | null = null;                  // never null after mediaInit

    constructor(manager: MediaCheckboxManager, id: string) {
        this.manager = manager;
        this.id = id;
        this.htmlLabelId  = `${this.id}-label`;
        this.htmlApplyId = `${this.id}-apply`;
    }

    mediaInit() {
        this.media = {
            label:  document.getElementById(this.htmlLabelId ) as HTMLInputElement,
            button: document.getElementById(this.htmlApplyId)  as HTMLButtonElement,
        };
        this.mediaUpdateBehavior();
    }
    mediaUpdateBehavior() {
        // Forbid empty label
        if (this.media!.label.value === '') {
            this.media!.label.classList.remove('error');
            this.media!.button.disabled = true;
            return;
        }

        // Forbid doubles
        for (const elt of this.manager.elts) {
            if (this.media!.label.value === elt.label) {
                this.media!.label.classList.add('error');
                this.media!.button.disabled = true;
                return;
            }
        }

        this.media!.label.classList.remove('error');
        this.media!.button.disabled = false;
    }
    mediaAddEventListener() {
        this.media!.label.addEventListener('input', () => {
            // console.log(this.id, `mediaAddEventListener label input = ${this.media!.label.value}`);
            this.mediaUpdateBehavior();
        });
        this.media!.button.addEventListener('click', () => {
            // console.log(this.id, "mediaAddEventListener button click");
            this.manager.mediaAddNewChild(this.media!.label.value, false);
        });
    }

    getHtmls(): string[] {
        const htmls = [];
        htmls.push(`<input  id="${this.htmlLabelId }" type="text" placeholder="*.cpp,*.c,*.h">`);
        htmls.push(``);  // no edit/valid button
        htmls.push(`<button id="${this.htmlApplyId}">&#10133;</button>`);
        return htmls;
    }
}

export class MediaFilesToManager extends MediaCheckboxManager {
    constructor(id: string) {
        super(id, "All", true, true);
    }
}

export class MediaFilesToIncludeManager extends MediaFilesToManager {
    constructor() {
        super("filesToInclude");
    }
}

export class MediaFilesToExcludeManager extends MediaFilesToManager {
    constructor() {
        super("filesToExclude");
    }
}

// Defines some parts of the mmi
export class MediaMmi {
    public readonly caseManager: MediaCaseManager;
    public readonly wordManager: MediaWordManager;
    public readonly filesToIncludeManager: MediaFilesToIncludeManager;
    public readonly filesToExcludeManager: MediaFilesToExcludeManager;
    public readonly managers: MediaCheckboxManager[];
    private readonly mainManagers: MediaCheckboxManager[];
    private readonly otherManagers: MediaCheckboxManager[];

	constructor(mediaSendMsg: any) {
        this.caseManager           = new MediaCaseManager();
        this.wordManager           = new MediaWordManager();
        this.filesToIncludeManager = new MediaFilesToIncludeManager();
        this.filesToExcludeManager = new MediaFilesToExcludeManager();
        this.mainManagers  = [this.caseManager, this.wordManager];
        this.otherManagers = [this.filesToIncludeManager, this.filesToExcludeManager];
        this.managers      = this.mainManagers.concat(this.otherManagers);
        mediaSendMessage = mediaSendMsg;
    }

    mediaAddEventListener(method: any) {
        for (const manager of this.mainManagers) {
            manager.mediaAddEventListener(method);
        }
        for (const manager of this.otherManagers) {
            manager.mediaAddEventListener(null);
        }
    }
    mediaUpdateMainMessage(message: Message) {
        for (const manager of this.mainManagers) {
            manager.mediaUpdateMessage(message);
        }
    }
}
