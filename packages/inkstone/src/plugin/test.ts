import Editor from "../editor";

export default class Font {
  editor: Editor;
  constructor(editor: Editor) {
    this.editor = editor;
    this.init()
  }
  init() {
    console.log(this.editor)
    this.editor.on('EditorInit', function() {
      console.log('需要实例化')
    })
  }

}
