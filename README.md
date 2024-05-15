# Case Search

The extension is based on native search component.  
It searches for multiple forms of presentation of your query string.  
Supports the following cases:

* kebab-case
* camelCase
* PascalCase
* snake_case
* UPPER_SNAKE_CASE
* Capital Case
* path/case


## Usage

To show the Case Search panel :  
- use shortcut keys `Ctrl+F1`, `⌘+F1`  
- invoke the command `Case Search: Incremental search by case` from the Command Palette (`Ctrl+⇧+P`, `⇧+⌘+P`).

You can then select zero, one or many appropriate cases.  
Input your query string for custom searching.  

![screenshot1](resources/screenshot1.gif)


## Case Begin/End/Whole Word  

Can search for :  
- word at beggining  
- word at end  
- whole word  

Taking into account the separator of the selected cases   
Also works without any selected case.  

Case Search for word at beggining :  
![screenshot_caseBeginWord](resources/screenshot_caseBeginWord.png)

Case Search for word at end :  
![screenshot_caseEndWord](resources/screenshot_caseEndWord.png)

Case Search for whole word :  
![screenshot_caseWholeWord](resources/screenshot_caseWholeWord.png)
