import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core'
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async'
import {provideRouter} from '@angular/router'
import routeConfig from './routes'

export const appConfig: ApplicationConfig = {
    providers: [provideZoneChangeDetection({eventCoalescing: true}), provideAnimationsAsync(), provideRouter(routeConfig)]
}
