import { Component } from '@angular/core';
import { DataService } from '../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss',
})
export class TextEditorComponent {
  constructor(public data: DataService) {}
}
