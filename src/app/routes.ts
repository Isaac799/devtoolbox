import {Routes} from '@angular/router'
import {PageHelpComponent} from './pages/page-help/page-help.component'
import {PageMigrationComponent} from './pages/page-migration/page-migration.component'
import {PageEditorComponent} from './pages/page-editor/page-editor.component'

const routeConfig: Routes = [
    {
        path: 'editor',
        component: PageEditorComponent,
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
