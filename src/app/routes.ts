import {PageCodeOutputComponent} from './pages/page-code-output/page-code-output.component'
import {PageGuiEditorComponent} from './pages/page-gui-editor/page-gui-editor.component'
import {Routes} from '@angular/router'

const routeConfig: Routes = [
    {
        path: 'manage-blueprints',
        component: PageGuiEditorComponent,
        title: 'Manage Blueprints'
    },
    {
        path: 'explore-results',
        component: PageCodeOutputComponent,
        title: 'Explore Results'
    },
    {
        path: '**',
        redirectTo: 'code'
    }
]

export default routeConfig
