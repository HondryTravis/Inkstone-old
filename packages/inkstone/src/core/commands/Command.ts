import Editor from "../../editor";
import { createOverride } from './Override';


const NativeCommands = (editor: Editor) => {

  let executionStackDepth = 0;

  const commands = new Map()

  const { selection, utils } = editor;

  const override = createOverride(utils.getActiveRange)

  const registryCommand = () => {

  }

  const editCommandMethod = (command: string, range: Range, callback: Function) => {
    if (executionStackDepth == 0 && typeof range != "undefined") {
      selection.setNativeRange(range)
    } else if (executionStackDepth == 0) {
      selection.setNativeRange(selection.getActiveRange())
    }

    executionStackDepth ++;
    let ret;

    try {
      ret = callback();
    } catch(e) {
        executionStackDepth --;
        throw e;
    }
    executionStackDepth--;
    return ret;
  }

  // command, showUi, value, range
  const execCommand = (...args) => {
    let [command, showUi, value, range] = args
    // 全部初始化命令为小写
    command = command.toLowerCase();
    // 如果只有一个参数，让 showUi 变为 false, 大于 4 个参数将不在处理
    if (args.length == 1
    || (args.length >=4 && typeof showUi == "undefined")) {
        showUi = false;
    }
    // 如果仅提供一个或两个参数，则让 value 为空字符串，设置默认值
    if (args.length <= 2
    || (args.length >=4 && typeof value == "undefined")) {
        value = "";
    }

    const execCallback = (command, showUi, value) => {
      return () => {
        const currentCommand = commands.get(command)
        if (!(command in currentCommand) || !queryCommandEnabled(command)) {
          return false;
        }
        // 执行命令操作，将值作为参数传递给指令，测试结果
        let ret = currentCommand.action(value);

        // 如果出现既不是 true 也不是 false 的问题，直接抛出异常
        if (ret !== true && ret !== false) {
          throw "execCommand() didn't return true or false: " + ret;
        }
        // 如果上一步错误，直接返回
        if (ret === false) {
          return false;
        }
        // 可以执行，命令启用……
        return true;
      }
    }

    return editCommandMethod(command, range, (execCallback)(command, showUi, value));

  }

  const queryCommandEnabled = (command: string, range?: Range) => {
    command = command.toLowerCase();
    const callback = function(command) {
        return function() {

        // 如果同时支持和启用命令，则返回true，否则返回false。
        if (!(commands.has(command))) {
          return false;
        }

        // “在本规范中定义的命令中，除cut命令和paste命令外，总是启用杂项命令中列出的命令。
        // 如果活动范围不为null，其开始节点可编辑或是编辑根节点，其结束节点是可编辑的，
        // 也可以是子编辑根节点，并且有一些编辑根节点是其开始节点和结束节点的共同祖先。”
        return ["copy", "defaultparagraphseparator", "selectall", "stylewithcss", "usecss"].indexOf(command) != -1
            || (
              utils.getActiveRange() !== null
              && (utils.isEditable(selection.getActiveRange().startContainer) || utils.isEditingHost(selection.getActiveRange().startContainer))
              && (utils.isEditable(selection.getActiveRange().endContainer) || utils.isEditingHost(selection.getActiveRange().endContainer))
              && (utils.getInclusiveAncestors(selection.getActiveRange().commonAncestorContainer).some(utils.isEditingHost))
            );
        }}

    return editCommandMethod(command, range, callback(command))
  }

  const queryCommandIndeterm = (command: string, range?: Range) => {
    command = command.toLowerCase();
    const callback = (command) => {
      return () => {
        // 如果命令不支持或者不确定，返回 false
        const currentCommand = commands.get(command)
        if (!currentCommand || !('indeterm' in currentCommand)) {
            return false;
        }
        // 如果命令不确定，则返回true，否则返回false
        return currentCommand.indeterm();
      }
    }
    return editCommandMethod(command, range, callback(command))
  }

  const queryCommandState = (command: string, range?: Range) => {
    command = command.toLowerCase();
    const callback = (command: string) => {
      return () => {
        // 如果命令不受支持或没有状态，则返回false。
        const currentCommand = commands.get(command)
        if (!(command in currentCommand) || !("state" in currentCommand[command])) {
            return false;
        }

        // 如果设置了命令的状态替代，则将其返回
        if (typeof override.getStateOverride(command) != "undefined") {
            return override.getStateOverride(command);
        }

        // 如果命令的状态为true，则返回true；否则为false
        return currentCommand.state();
      }
    }
    return editCommandMethod(command, range, callback(command))
  }
  // 当编辑器使用 queryCommandSupported（command）方法时调用接口，如果命令为受支持，否则为false。
  const queryCommandSupported = (command: string) => commands.get(command.toLowerCase())
  const queryCommandValue = (command: string, range?: Range) => {
    command = command.toLowerCase();
    const callback = function() {
      // 如果不支持命令或命令没有值，则返回空字符串
      const currentCommand = commands.get(command)
      if (!(command in currentCommand) || !("value" in currentCommand[command])) {
        return "";
      }
      // 如果命令是 fontSize 并且设置了其值替代，则将值替代转换为整数个像素，并返回结果的旧字体大小
      if (command == "fontsize"
      && override.getValueOverride("fontsize") !== undefined) {
        return utils.getLegacyFontSize(override.getValueOverride("fontsize"));
      }

      // 如果已经设置了覆盖命令的结果，直接返回
      if (typeof override.getValueOverride(command) != "undefined") {
        return override.getValueOverride(command);
      }

      // 返回命令的结果
      return currentCommand.value();
    }
    return editCommandMethod(command, range, callback)
  }
  const exports = {
    registryCommand,
    execCommand,
    queryCommandEnabled,
    queryCommandIndeterm,
    queryCommandState,
    queryCommandSupported,
    queryCommandValue
  }
  return exports
}

export {
  NativeCommands
}
