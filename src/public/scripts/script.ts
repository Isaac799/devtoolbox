import { HtmlCodeGenerator } from './generators/html_js';
import { NodeExpressCodeGenerator } from './generators/node_js_express';
import { SqlGenerator } from './generators/postgres_sql';
import { InputParser } from './core/parser';
import { CodeGenerator } from './core/structure';

import '../assets/normalize.css';
import '../assets/styles.css';
import { TsTypesCodeGenerator } from './generators/ts_types';

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
                let container = document.getElementById(appItem.htmlLabel);
                if (!container) {
                        break;
                }
                if (appItem.htmlLabel === currentAppItem.htmlLabel) {
                        container.classList.add('selected');
                } else {
                        container.classList.remove('selected');
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
                container.classList.add('primary', 'p-1');

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
 *
 * @param {string} value
 */
function RunCodeGeneratorForSelectedTabItem(value: string) {
        let input = document.getElementById('markdown-input') as HTMLInputElement;
        let errorOut = document.getElementById('error-output');
        let output = document.getElementById('code-output');

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

        let parser = new InputParser();

        parser.Clear();

        let currentAppItem = APP_ITEMS[focusedAppItemIndex];

        if (!currentAppItem.generator) {
                errorOut.style.display = 'none';
                output.innerText = 'There is no generator for this item yet.';
                return;
        }

        let parserOutput = parser.SetInput(value).Run().Read();
        let code = currentAppItem.generator.Clear().SetInput(parserOutput).Run().Read();

        let errors = [...parser.errorMessages, ...currentAppItem.generator.errorMessages];

        if (errors.length === 0) {
                errorOut.style.display = 'none';
        } else {
                let errorUl = document.createElement('ul');
                for (let i = 0; i < errors.length; i++) {
                        const error = errors[i];
                        let errorLi = document.createElement('li');
                        errorLi.innerText = error;
                        errorUl.appendChild(errorLi);
                }
                errorOut.style.display = 'block';
                errorOut.innerHTML = '';
                errorOut.appendChild(errorUl);
        }

        output.innerText = code;
}

function Main(_: Event) {
        let inputCopy = document.getElementById('copy-input');
        let outputCopy = document.getElementById('copy-output');
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
                        input.value = `## creature

- person CRUD
  - s first_name +
  - s last_name +
  - ts _birthday ! CURRENT_TIMESTAMP
  - b alive !

## world

- kingdom + 
  - s name *
  - m description

- village +
  - ^ kingdom|ruled_by **
  - ^ creature.person|elder *
  - s name **

- tavern + 
  - ^ village *
  - s name *
  - b has_food
  - b vacancy

- patron + @ CRUD
  - ^ _creature.person ! * **
  - ^ _tavern ! * 
  - ts departed_on ?
  - b paid`;
                        RunCodeGeneratorForSelectedTabItem(input.value);
                }
        }
}

let focusedAppItemIndex = 0;
const APP_ITEMS = [
        new AppItem('Postgres SQL', new SqlGenerator()),
        new AppItem('TS types', new TsTypesCodeGenerator()),
        new AppItem('Express JS', new NodeExpressCodeGenerator()),
        new AppItem('HTML Forms', new HtmlCodeGenerator()),
        // new AppItem('GO', undefined),
        // new AppItem('Node/Express', undefined),
        // new AppItem('HTML', undefined),
        // new AppItem('Angular', undefined),
];

window.addEventListener('DOMContentLoaded', Main);
