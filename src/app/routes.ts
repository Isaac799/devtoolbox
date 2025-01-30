import {PageCodeOutputComponent} from './pages/page-code-output/page-code-output.component'
import {PageGuiEditorComponent} from './pages/page-gui-editor/page-gui-editor.component'
import {Routes} from '@angular/router'

const routeConfig: Routes = [
    {
        path: 'view',
        component: PageCodeOutputComponent,
        title: 'Code View'
    },
    {
        path: 'editor',
        component: PageGuiEditorComponent,
        title: 'Blueprint Editor'
    },
    {
        path: '**',
        redirectTo: 'code'
    }
]

export default routeConfig
