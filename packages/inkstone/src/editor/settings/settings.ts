interface ISettings {
    selecter?: string
    plugins?: string[] | string
}



const Settings = function (settings: ISettings) {
    let current: ISettings = settings

    const getPluginList = () => current.plugins

    const getSelecter = () => current.selecter

    return {
        getPluginList,
        getSelecter
    }
}
