import { SqlGenerator } from './generators/sql/postgres_sql';
import { InputParser } from './core/parser';
import { CodeGenerator, FileOutputs } from './core/structure';

import '../assets/normalize.css';
import '../assets/styles.css';
import { TsTypesCodeGenerator } from './generators/js/ts_types';
import { GoCodeGenerator } from './generators/go/go';
import { downloadZip } from './core/download';

let toDownload: any = {};

class AppItem {
        htmlLabel = 'Empty';
        generator: CodeGenerator | null = null;

        constructor(htmlLabel: string, generator: CodeGenerator | null) {
                this.htmlLabel = htmlLabel;
                this.generator = generator;
        }
}

let debounce: ReturnType<typeof setTimeout> | undefined = undefined;

function UpdateSelectedTab() {
        for (let i = 0; i < APP_ITEMS.length; i++) {
                const appItem = APP_ITEMS[i];
                let currentAppItem = APP_ITEMS[focusedAppItemIndex];
                let el = document.getElementById(appItem.htmlLabel);
                if (!el) {
                        break;
                }
                if (appItem.htmlLabel === currentAppItem.htmlLabel) {
                        el.classList.add('selected');
                        el.classList.add('primary');
                        // el.classList.remove('gray');
                        el.classList.add('hover-none');
                        el.classList.remove('hover-highlight');
                } else {
                        el.classList.remove('selected');
                        el.classList.remove('primary');
                        // el.classList.add('gray');
                        el.classList.remove('hover-none');
                        el.classList.add('hover-highlight');
                }
        }
}

function UpdateSelectedFile(selectedFileName: string) {
        selectedFileOutputs = selectedFileName;

        let output = document.getElementById('code-output');
        if (output === null) {
                console.error('Missing core html element!');
                return;
        }
        output.innerText = fileOutputs[selectedFileOutputs];

        for (const fileName in fileOutputs) {
                if (!Object.prototype.hasOwnProperty.call(fileOutputs, fileName)) {
                        continue;
                }
                let el = document.getElementById(fileName);
                if (!el) {
                        break;
                }
                if (fileName === selectedFileName) {
                        el.classList.add('selected');
                        el.classList.add('primary');
                        // el.classList.remove('gray');
                        el.classList.add('hover-none');
                        el.classList.remove('hover-highlight');
                } else {
                        el.classList.remove('selected');
                        el.classList.remove('primary');
                        // el.classList.add('gray');
                        el.classList.remove('hover-none');
                        el.classList.add('hover-highlight');
                }
        }
}

/**
 * @returns {Array.<HTMLElement>}
 */
function BuildTabMenu() {
        let input = document.getElementById('markdown-input') as HTMLInputElement;

        if (input === null) {
                console.error('Missing core html element!');
                return [];
        }

        let tabItems: HTMLDivElement[] = [];

        for (let i = 0; i < APP_ITEMS.length; i++) {
                const appItem = APP_ITEMS[i];

                let container = document.createElement('div');
                container.setAttribute('id', appItem.htmlLabel);
                container.innerText = appItem.htmlLabel;
                container.classList.add('p-1');

                container.addEventListener('click', () => {
                        focusedAppItemIndex = i;
                        RunCodeGeneratorForSelectedTabItem(input.value || '');
                        UpdateSelectedTab();
                });
                tabItems.push(container);
        }

        return tabItems;
}

/**
 * @returns {Array.<HTMLElement>}
 */
function BuildFileMenu() {
        let files: HTMLDivElement[] = [];

        for (const fileName in fileOutputs) {
                if (!Object.prototype.hasOwnProperty.call(fileOutputs, fileName)) {
                        continue;
                }
                const fileContent = fileOutputs[fileName];
                if (!fileContent) continue;

                let file = document.createElement('div');
                file.setAttribute('id', fileName);
                file.innerText = fileName;
                file.classList.add('primary', 'p-1');

                file.addEventListener('click', () => {
                        UpdateSelectedFile(fileName);
                });
                files.push(file);
        }

        return files;
}

/**
 *
 * @param {string} value
 */
function RunCodeGeneratorForSelectedTabItem(value: string) {
        let input = document.getElementById('markdown-input') as HTMLInputElement;
        let errorOut = document.getElementById('error-output');
        let output = document.getElementById('code-output');
        let files = document.getElementById('files-output');

        if (input === null) {
                console.error('Missing core html element!');
                return;
        }

        if (errorOut === null) {
                console.error('Missing core html element!');
                return;
        }

        if (output === null) {
                console.error('Missing core html element!');
                return;
        }

        if (files === null) {
                console.error('Missing core html element!');
                return;
        }

        let parser = new InputParser();

        parser.Clear();

        let currentAppItem = APP_ITEMS[focusedAppItemIndex];

        if (!currentAppItem.generator) {
                errorOut.style.display = 'none';
                output.innerText = 'There is no generator for this item yet.';
                return;
        }

        let parserOutput = parser.SetInput(value).Run().Read();
        let generatedFiles = currentAppItem.generator.Clear().SetInput(parserOutput).Run().Read();

        let errors = [...parser.errorMessages, ...currentAppItem.generator.errorMessages];

        if (errors.length === 0) {
                errorOut.style.display = 'none';
        } else {
                errorOut.innerHTML = '';

                for (let i = 0; i < errors.length; i++) {
                        const error = errors[i];
                        let errorItem = document.createElement('div');
                        errorItem.classList.add('warn');
                        errorItem.classList.add('p-1');
                        errorItem.innerText = error;
                        errorOut.appendChild(errorItem);
                }
                errorOut.style.display = 'block';
        }

        fileOutputs = generatedFiles;

        if (!Object.keys(generatedFiles).includes(selectedFileOutputs)) {
                selectedFileOutputs = Object.keys(generatedFiles)[0];
        }

        toDownload = generatedFiles;

        let fileItems = BuildFileMenu();
        files.innerHTML = '';
        for (let i = 0; i < fileItems.length; i++) {
                const tab = fileItems[i];
                files.appendChild(tab);
        }
        UpdateSelectedFile(selectedFileOutputs);
}

function Main(_: Event) {
        let inputCopy = document.getElementById('copy-input');
        let outputCopy = document.getElementById('copy-output');
        let outputDownload = document.getElementById('download-output');
        let input = document.getElementById('markdown-input') as HTMLInputElement;
        let tabItemMenu = document.getElementById('app-item-tab-menu');
        let output = document.getElementById('code-output');

        if (inputCopy === null) {
                console.error('Missing core html element!');
                return;
        }
        if (outputCopy === null) {
                console.error('Missing core html element!');
                return;
        }
        if (outputDownload === null) {
                console.error('Missing core html element!');
                return;
        }
        if (input === null) {
                console.error('Missing core html element!');
                return;
        }
        if (tabItemMenu === null) {
                console.error('Missing core html element!');
                return;
        }
        if (output === null) {
                console.error('Missing core html element!');
                return;
        }

        inputCopy.addEventListener('click', (_) => {
                navigator.clipboard.writeText(input.value);
        });
        outputCopy.addEventListener('click', (_) => {
                navigator.clipboard.writeText(output.innerText);
        });
        outputDownload.addEventListener('click', (_) => {
                downloadZip(toDownload, `${APP_ITEMS[focusedAppItemIndex].htmlLabel}-${Date.now().toString().slice(5, 11)}`);
        });

        let tabItems = BuildTabMenu();
        for (let i = 0; i < tabItems.length; i++) {
                const tab = tabItems[i];
                tabItemMenu.appendChild(tab);
        }
        UpdateSelectedTab();

        const run = (event: any) => {
                clearTimeout(debounce);
                debounce = setTimeout(() => {
                        RunCodeGeneratorForSelectedTabItem(event.target.value);
                        sessionStorage.setItem('previous-input', event.target.value);
                }, 500);
        };
        input.addEventListener('input', run);
        input.addEventListener('paste', run);
        input.addEventListener('cut', run);

        if (input.value) {
                RunCodeGeneratorForSelectedTabItem(input.value);
        } else {
                let previousInput = sessionStorage.getItem('previous-input');
                if (previousInput) {
                        input.value = previousInput;
                        RunCodeGeneratorForSelectedTabItem(input.value);
                } else {
                        input.value = DEFAULT_INPUT;
                        RunCodeGeneratorForSelectedTabItem(input.value.trim());
                }
        }
}

let focusedAppItemIndex = 0;
let fileOutputs: FileOutputs = {};
let selectedFileOutputs: string = '';

const APP_ITEMS = [
        new AppItem('Postgres', new SqlGenerator()),
        new AppItem('Go', new GoCodeGenerator()),
        // new AppItem('Node JS', new NodeExpressCodeGenerator()),
        new AppItem('TS Types', new TsTypesCodeGenerator()),
        // new AppItem('HTML forms', new HtmlCodeGenerator()),

        // new AppItem('Go structs', new GoTypesCodeGenerator()),
        // new AppItem('GO', undefined),
        // new AppItem('Node/Express', undefined),
        // new AppItem('HTML', undefined),
        // new AppItem('Angular', undefined),
];

window.addEventListener('DOMContentLoaded', Main);

const DEFAULT_INPUT = `

## customer

- customer +
  - s email * 
  - s username **
  - b active

## catalog

- category + 
  - s title *

- product + 
  - s title * !
  - d price !

- product_category
  - ^ product + !
  - ^ category + !

## shopping_cart

- cart + 
  - ^ customer.customer ! *
  
- cart_item @ 
  - ^ _cart +
  - ^ _catalog.product +
  - d _price_when_carted !

## orders

- order + @ 
  - ^ _customer.customer ! *
  - b finalized !
  - d _total_cost !
  
- order_item @ 
  - ^ order + !
  - ^ catalog.product + !

`.trim();
