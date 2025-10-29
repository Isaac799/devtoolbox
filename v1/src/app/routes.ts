import {Routes} from '@angular/router'
import {PageHelpComponent} from './pages/page-help/page-help.component'
import {PageMigrationComponent} from './pages/page-migration/page-migration.component'
import {EditorComponent} from './pages/editor/editor.component'

const routeConfig: Routes = [
    {
        path: 'editor',
        component: EditorComponent,
        title: 'Editor'
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
        redirectTo: 'editor'
    }
]

export default routeConfig
