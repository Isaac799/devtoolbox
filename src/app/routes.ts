import {PageCodeOutputComponent} from './pages/page-code-output/page-code-output.component'
import {Routes} from '@angular/router'
import {PageTextEditorComponent} from './pages/page-text-editor/page-text-editor.component'
import {PageSplitViewComponent} from './pages/page-split-view/page-split-view.component'
import {PageGuiEditorComponent} from './pages/page-gui-editor/page-gui-editor.component'
import {PageHelpComponent} from './pages/page-help/page-help.component'
import {PageMigrationComponent} from './pages/page-migration/page-migration.component'

const routeConfig: Routes = [
    {
        path: 'tui',
        component: PageTextEditorComponent,
        title: 'Manage (TUI)'
    },
    {
        path: 'gui',
        component: PageGuiEditorComponent,
        title: 'Manage (GUI)'
    },
    {
        path: 'boilerplate',
        component: PageCodeOutputComponent,
        title: 'Boilerplate'
    },
    {
        path: 'tui-boil',
        component: PageSplitViewComponent,
        title: 'Split'
    },
    {
        path: 'migration',
        component: PageMigrationComponent,
        title: 'Migration'
    },
    {
        path: 'about',
        component: PageHelpComponent,
        title: 'About'
    },
    {
        path: '**',
        redirectTo: 'boilerplate'
    }
]

export default routeConfig
