import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent implements OnInit, OnDestroy {
  private keyListeners = (ev: KeyboardEvent) => {
    if (['Enter', 'Return'].includes(ev.key)) {
      this.doClickAccept();
    }
    if (['Escape'].includes(ev.key)) {
      this.doClickAway();
    }
  };

  ngOnInit(): void {
    window.addEventListener('keyup', this.keyListeners);
  }
  
  ngOnDestroy(): void {
    window.removeEventListener('keyup', this.keyListeners);
  }

  @Input()  disableAccept = false;
 
  private _visible = false;
  public get visible() {
    return this._visible;
  }
  @Input() public set visible(value) {
    if (this._visible !== value) {
      this.visibleChange.emit(value);
    }
    this._visible = value;
  }
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() title = '';
  @Input() textAccept = 'Save';
  @Input() textReject = 'Cancel';

  @Output() accepted = new EventEmitter<void>();
  @Output() rejected = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  doClickAccept() {
    this.visible = false;
    this.accepted.emit();
  }
  doClickReject() {
    this.visible = false;
    this.rejected.emit();
  }
  doClickAway() {
    this.visible = false;
    this.close.emit();
  }
}
