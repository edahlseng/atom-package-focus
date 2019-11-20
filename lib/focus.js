'use babel';

import { CompositeDisposable } from 'atom';

import {updateSelectView} from './focus-view.js';

let state = {
    selectViewShowing: false,
    treeViewRoots: [],
    query: ''
};

const actions = {
    closeSelectView: () => setState({...state, selectViewShowing: false}),
    setFocus: ({projectToFocus}) => {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'tabs:close-all-tabs')
        const treeViews = atom.workspace.getLeftDock().getPaneItems().filter(paneItem => paneItem.constructor.name === 'TreeView');
        treeViews.forEach(paneItem => {
            atom.commands.dispatch(paneItem.element, 'tree-view:collapse-all')
        })

        const treeView = treeViews[0];
        const rootToExpand = treeView && treeView.roots.filter(root => root.directory.name === projectToFocus)[0];
        treeView && atom.commands.dispatch(treeView.element, 'tree-view:unfocus');
        treeView && atom.commands.dispatch(treeView.element, 'tree-view:toggle-focus');
        rootToExpand && window.setImmediate(() => {
            rootToExpand.click();
            rootToExpand.scrollIntoView({ block: 'center', inline: 'start' });
        });

        setState({...state, selectViewShowing: false, query: ''})
    },
    updateQuery: (query) => query !== state.query && setState({...state, query})
}

const setState = (newState) => {
    state = newState;
    state.treeViewRoots = atom.workspace.getLeftDock().getPaneItems().filter(paneItem => paneItem.constructor.name === 'TreeView')[0].roots.map(root => root.directory.name);

    updateSelectView(state, actions);
}

// TODO: change from stateUpdates to update function
const updateState = (stateUpdates) => setState({...state, ...stateUpdates})

export default {
  focusView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'focus:set-focus': () => updateState({selectViewShowing: true})
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },
};
