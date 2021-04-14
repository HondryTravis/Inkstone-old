declare namespace InkStone {

  type MAP_EACH_CALLBACK = (value: any, key: string, map: Map<string, any>) => void

  export interface IInkStone {
    editor: any;
  }

  export interface IContainer {
    use(name: string): any;
    get(name: string): any;
    bind(name: string, value: any, isCore?: boolean): void;
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

declare interface Window {
  InkStone: any
}

