
export default class Editor {
  inkstone: InkStone.IInkStone
  container: InkStone.IContainer
  constructor() {}
  inject(inkstone: InkStone.IInkStone) {
    this.inkstone = inkstone
    this.container = inkstone.container
  }
  render() {
    const { settings } = this.inkstone;
    const { selector } = settings
  }
}
