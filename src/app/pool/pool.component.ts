import {Component} from '@angular/core'
import {CommonModule} from '@angular/common'
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {DataService} from '../services/data.service'

@Component({
    selector: 'app-pool',
    imports: [FormsModule, CommonModule, ReactiveFormsModule],
    templateUrl: './pool.component.html',
    styleUrl: './pool.component.scss'
})
export class PoolComponent {
    constructor(public data: DataService) {}
}
