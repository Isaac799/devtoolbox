import {ChangeDetectorRef, Component} from '@angular/core'
import {AppMode} from '../structure'
import {ModalComponent} from '../modal/modal.component'
import {CommonModule} from '@angular/common'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {DataService} from '../services/data.service'
import {NotificationService} from '../services/notification.service'
import {NotificationKind, NotificationLife} from '../structure'
import {Notification} from '../structure'
import YAML from 'yaml'

@Component({
    selector: 'app-pool',
    imports: [ModalComponent, FormsModule, CommonModule, ReactiveFormsModule],
    templateUrl: './pool.component.html',
    styleUrl: './pool.component.scss'
})
export class PoolComponent {
    constructor(
        private cdr: ChangeDetectorRef,
        public data: DataService,
        private notification: NotificationService
    ) {}

    showSettingsModal = false

    modeOptions = [
        {
            name: 'JSON',
            value: AppMode.JSON
        },
        {
            name: 'YAML',
            value: AppMode.YAML
        }
    ]

    copyConfig() {
        let str = ''
        if (this.data.app.mode === AppMode.JSON) {
            str = JSON.stringify(this.data.schemasConfig, null, 4)
        } else if (this.data.app.mode === AppMode.YAML) {
            str = YAML.stringify(this.data.schemasConfig)
        }
        navigator.clipboard.writeText(str)
        this.notification.Add(
            new Notification(
                'Copied',
                'The config was copied to your clipboard.',
                NotificationKind.Info,
                NotificationLife.Short
            )
        )
    }
}
