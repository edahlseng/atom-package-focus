'use babel';

import SelectListView from 'atom-select-list';

let _directoriesListView;
const directoriesList = ({focused, treeViewRoots, closeSelectView, setFocus, query, updateQuery, addPostMountingCommand}) => {
    if (!_directoriesListView) {
        _directoriesListView = new SelectListView({
            items: treeViewRoots,
            elementForItem: (item) => {
                const element = document.createElement('li');
                element.innerText = item;
                return element;
            },
            didCancelSelection: closeSelectView,
            didConfirmSelection: (projectName) => setFocus({projectToFocus: projectName}),
            query,
            didChangeQuery: updateQuery
        });
    }
    _directoriesListView.update({
        items: treeViewRoots,
        query,
    })
    addPostMountingCommand(() => _directoriesListView.focus());
    return _directoriesListView.element;
}

let _selectViewPanel;
const selectViewPanel = ({visible, treeViewRoots, closeSelectView, setFocus, children}) => {
    if (!_selectViewPanel || _selectViewPanel.getItem() !== children) {
        _selectViewPanel = atom.workspace.addModalPanel({
          item: children,
          visible: visible
        })
    } else {
        _selectViewPanel.isVisible() && !visible && _selectViewPanel.hide();
        !_selectViewPanel.isVisible() && visible && _selectViewPanel.show();
    }
    return _selectViewPanel;
}

export const updateSelectView = ({selectViewShowing, treeViewRoots, query}, {closeSelectView, setFocus, updateQuery}) => {
    const postMountingCommands = []

    selectViewPanel({
        visible: selectViewShowing,
        treeViewRoots,
        closeSelectView,
        setFocus,
        children: directoriesList({focused: selectViewShowing, closeSelectView, treeViewRoots, setFocus, query, updateQuery, addPostMountingCommand: (command) => postMountingCommands.push(command)})
    })

    postMountingCommands.forEach(command => window.setImmediate(command));
}
