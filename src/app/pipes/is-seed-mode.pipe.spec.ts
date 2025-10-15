import { IsSeedModePipe } from './is-seed-mode.pipe';

describe('IsSeedModePipe', () => {
  it('create an instance', () => {
    const pipe = new IsSeedModePipe();
    expect(pipe).toBeTruthy();
  });
});
