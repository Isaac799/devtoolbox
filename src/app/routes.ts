import {PageCodeOutputComponent} from './pages/page-code-output/page-code-output.component'
import {Routes} from '@angular/router'
import { PageTextEditorComponent } from './pages/page-text-editor/page-text-editor.component'

const routeConfig: Routes = [
    {
        path: 'manage-blueprints',
        component: PageTextEditorComponent,
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
