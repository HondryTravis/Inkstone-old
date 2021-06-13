import Editor from "../editor";

export default function Bold(editor: Editor) {

    const { commands, selection } = editor

    const inlineCommandActivatedValues = ["bold", "600", "700", "800", "900"]

    const relevantCssProperty = "fontWeight"

    editor.on('EditorInit', function () {
        // console.log('test')
    })

    const action = () => {
        if (commands.queryCommandState("bold")) {
            commands.setSelectionValue("bold", "normal");
        } else {
            commands.setSelectionValue("bold", "bold");
        }
        return true;
    }

    const equivalentValues = (val1, val2) => {

        return val1 == val2
            || (val1 == "bold" && val2 == "700")
            || (val1 == "700" && val2 == "bold")
            || (val1 == "normal" && val2 == "400")
            || (val1 == "400" && val2 == "normal");
    }

    return commands.registryCommand('bold', {
        inlineCommandActivatedValues,
        relevantCssProperty,
        action,
        equivalentValues
    })
}
