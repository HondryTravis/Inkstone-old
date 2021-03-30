declare namespace InkStone {

  type MAP_EACH_CALLBACK = (value: any, key: string, map: Map<string, any>) => void

  export interface IInkStone {
    editor: any;
    settings: any;
    container: IContainer
    inject(key, module): void;
    fire(key, ...args: any[]): void;
    on(key, callback: Function): void;
    create(): void;
    destroy(): void;
    setup(settings): void;
  }

  export interface IContainer {
    use(name: string): any;
    add(name: string, value: any): void;
    eachItem(callback: MAP_EACH_CALLBACK): void;
    remove(name: string): void;
  }

  export interface ISelection {}

  export interface INativeDOM extends Document {
    doc: Document;
  }

  export interface INativeSelection extends Selection {}

  export interface INativeRange extends Range {}
}

