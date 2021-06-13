interface ISettings {
    selecter?: string
    plugins?: string[] | string
    fontsize?: string
}



const Settings = function (settings: ISettings) {
    let current: ISettings = settings

    const getPluginList = () => current.plugins

    const getSelecter = () => current.selecter

    const getFontSizeList = () => {
        if (!current.fontsize) return
        return Array.isArray(current.fontsize)
            && current.fontsize
            || current.fontsize.split(' ')
    }

    return {
        getPluginList,
        getSelecter,
        getFontSizeList
    }
}
