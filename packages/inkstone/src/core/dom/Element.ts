export default class NativeElement {
  static of(args) {
    return new NativeElement(args)
  }
  tag: string
  props: any
  children: any[]
  constructor(args) {
    this.tag = args.tag
    this.props = args.props
    this.children = args.children
  }
  render(): HTMLElement {
    const ele = document.createElement(this.tag)
    const props = this.props;
    const children = this.children || [];
    for(const propName in props){
      const propValue = props[propName];
      ele.setAttribute(propName, propValue);
    }
    children.forEach(( child: any) => {
      const childEl = child instanceof NativeElement ? child.render() : document.createTextNode(child)
      ele.appendChild(childEl);
    })
    return ele;
  }
}
