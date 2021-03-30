import Components from './components/index';
import InkStoneElement from './components/InkStoneElement';


const testHTML = `  <p>Finally, as an exercise, we can go ahead and print the require function in the b.js file. To learn more about the
output of the require function, we can check the implementation in this section of the Node source code.</p>
<p>As shown above, we can see the module object on line 6 with all the properties, including the filename, id,
children, path depth, etc. Also, we can see the argument object, which consists of the export object, require
function, file and folder path, and the Module (which is essentially what the wrapper function does, but it executes
the code contained in a file/module).</p>
<p>
<span>As shown above,</span> <span>can check the implementation in this section of</span>
</p>`


export default class Editor {
  inkstone: InkStone.IInkStone
  container: InkStone.IContainer
  components: Map<any, any>;
  InkStoneElement: InkStoneElement
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
    this.InkStoneElement = document.createElement('ink-stone') as InkStoneElement
    this.InkStoneElement.inject(this.inkstone)
    this.InkStoneElement.setContent(testHTML)

    console.dir(this.InkStoneElement)
    wrapper.appendChild(this.InkStoneElement)
  }
}
