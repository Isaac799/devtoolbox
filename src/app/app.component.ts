import { Component, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { AppService } from './services/app.service'
import { InformService } from './services/inform.service'

@Component({
    selector: 'app-root',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
    private readonly router = inject(Router)
    private readonly appService = inject(AppService)
    readonly informService = inject(InformService)

    ngOnInit(): void {
        this.appService.Initialize()
    }

    showSettings() {
        this.router.navigate(['/settings'])
    }
}
