import Components from './components/index';
import InkStoneElement from './components/InkStoneElement';

export default class Editor {
  inkstone: InkStone.IInkStone
  container: InkStone.IContainer
  components: Map<any, any>;
  inkStoneElement: InkStoneElement
  constructor() {
    this.components = Components;
  }
  inject(inkstone: InkStone.IInkStone) {
    this.inkstone = inkstone
    this.container = inkstone.container
  }
  render() {
    const { settings } = this.inkstone;
    const { selector } = settings
    const wrapper = document.querySelector(selector)
    let cache = wrapper.innerHTML
    this.inkStoneElement = document.createElement('ink-stone') as InkStoneElement
    this.inkStoneElement.inject(this.inkstone)
    this.inkStoneElement.setContent(cache)
    cache = null
    wrapper.innerHTML = ``
    wrapper.appendChild(this.inkStoneElement)
  }
}
