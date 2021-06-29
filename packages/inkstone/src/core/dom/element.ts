type IChild = NativeElement | string | number

interface INativeElement {
    render(): HTMLElement
}

export interface IOption {
    tagName: string,
    props: {},
    children: Array<IChild>
}

export default class NativeElement implements INativeElement {
    tagName: string
    props: {}
    children: Array<IChild>

    static create({ tagName, props, children }: IOption) {
        return new NativeElement({ tagName, props, children })
    }

    constructor({ tagName, props, children }: IOption) {
        this.tagName = tagName
        this.props = props
        this.children = children
    }

    public render(): HTMLElement {
        const ele = document.createElement(this.tagName)
        const props = this.props || {};
        const children = this.children || [];

        for (const propName in props) {
            const propsValue = props[propName];
            ele.setAttribute(propName, propsValue);
        }

        for (const child of children) {
            const childEl = child instanceof NativeElement ? child.render() : document.createTextNode(child.toString())
            ele.appendChild(childEl);
        }
        return ele;
    }
}
