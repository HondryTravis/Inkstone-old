import Components from './components/index';
import InkStoneElement from './components/InkStoneElement';
import * as Constants from './constant'
export default class Editor {
    container: InkStone.IContainer
    components: Map<any, any>;
    root: InkStoneElement;
    listeners: any;
    dom: any;
    core: any;
    selection: any;
    utils: any
    settings: any
    commands: any
    constructor() {
        this.components = Components;
    }
    inject(key, ctor, isCore?) {
        if (isCore && isCore === true) {
            this.core = ctor
            this.container = this.core.NativeContainer()
        }
        this.container.bind(key, ctor, isCore)
    }
    fire(eventName, ...args) {
        this.listeners && this.listeners.fire(eventName, args)
    }
    on(eventName, callback) {
        this.listeners && this.listeners.on(eventName, callback)
    }
    preset(settings) {
        this.settings = settings
    }
    render() {
        this.setup()
        const { selector } = this.settings
        const wrapper = document.querySelector(selector)
        let node
        while (node = wrapper.firstChild) {
            this.root.add(node)
        }
        this.dom.add(wrapper, this.root)
        this.fire(Constants.EDITOR_INIT, this)
    }
    setup() {
        this.root = document.createElement('ink-stone') as InkStoneElement
        this.root.inject(this)

        this.utils = this.core.Utils
        this.dom = this.core.NativeDOM(document, this.root)
        this.selection = this.core.NativeSelection(this)
        this.listeners = this.core.NativeEvent()
        this.commands = this.core.NativeCommands(this)

        this.container.eachItem((item) => {
            !item.isCore && (item.instance ?? (item.instance = item.ctor(this)))
        })

        this.commands.preset()
    }
    destroy() {
        this.root.remove()
    }
    execCommand(command, showUi, value) {
        this.commands.execCommand(command, showUi, value)
    }
}
