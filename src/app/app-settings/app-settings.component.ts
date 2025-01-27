import {Component} from '@angular/core'
import {DataService} from '../services/data.service'
import {CommonModule} from '@angular/common'

@Component({
    standalone: true,
    selector: 'app-app-settings',
    imports: [CommonModule],
    templateUrl: './app-settings.component.html',
    styleUrl: './app-settings.component.scss'
})
export class AppSettingsComponent {
    constructor(public data: DataService) {}
}
