import {PageCodeOutputComponent} from './pages/page-code-output/page-code-output.component'
import {Routes} from '@angular/router'
import { PageTextEditorComponent } from './pages/page-text-editor/page-text-editor.component'
import { PageSplitViewComponent } from './pages/page-split-view/page-split-view.component'
import { PageGuiEditorComponent } from './pages/page-gui-editor/page-gui-editor.component'

const routeConfig: Routes = [
    {
        path: 'manage-blueprints',
        component: PageTextEditorComponent,
        title: 'Manage Blueprints'
    },
    {
        path: 'manage-blueprints-gui',
        component: PageGuiEditorComponent,
        title: 'Manage Blueprints'
    },
    {
        path: 'explore-results',
        component: PageCodeOutputComponent,
        title: 'Explore Results'
    },
    {
        path: 'manage-and-explore',
        component: PageSplitViewComponent,
        title: 'Manage & Explore'
    },
    {
        path: '**',
        redirectTo: 'manage-blueprints'
    }
]

export default routeConfig
