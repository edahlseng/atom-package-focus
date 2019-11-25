'use babel';

import { CompositeDisposable } from 'atom';
import path from 'path';

import {updateSelectView} from './focus-view.js';

let state = {
    selectViewShowing: false,
    treeViewRoots: [],
    query: ''
};

const actions = {
    closeSelectView: () => setState({...state, selectViewShowing: false}),
    openAndFocusProject: ({projectToOpen}) => {
        const treeViews = atom.workspace.getLeftDock().getPaneItems().filter(paneItem => paneItem.constructor.name === 'TreeView');
        const treeView = treeViews[0];
        const rootToExpand = treeView && treeView.roots.filter(root => root.directory.name === projectToOpen)[0];
        treeView && atom.commands.dispatch(treeView.element, 'tree-view:unfocus');
        treeView && atom.commands.dispatch(treeView.element, 'tree-view:toggle-focus');
        treeView && rootToExpand && window.setImmediate(() => {
            treeView.selectEntry(rootToExpand);
            !rootToExpand.classList.contains('expanded') && atom.commands.dispatch(treeView.element, 'tree-view:expand-item');
            rootToExpand.scrollIntoView({ block: 'center', inline: 'start' });
        });
    },
    setFocus: ({projectToFocus}) => {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'tabs:close-all-tabs')
        const treeViews = atom.workspace.getLeftDock().getPaneItems().filter(paneItem => paneItem.constructor.name === 'TreeView');
        treeViews.forEach(paneItem => {
            atom.commands.dispatch(paneItem.element, 'tree-view:collapse-all')
        })

        actions.openAndFocusProject({projectToOpen: projectToFocus});

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

  addProjectSubscriptions(projectPaths) {
      this.projectSubscriptions && this.projectSubscriptions.dispose();

      // Register commands for opening and focusing another project
      const commands = projectPaths.reduce(
          (commands, projectPath) =>
            ({
                ...commands,
                [`focus:${path.basename(projectPath)}`]: () => actions.openAndFocusProject({projectToOpen: path.basename(projectPath)})
            }),
          {}
      );
      this.projectSubscriptions = atom.commands.add('atom-workspace', commands);
  },

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    this.projectSubscriptions = null;

    this.subscriptions.add(atom.project.onDidChangePaths((...args) => this.addProjectSubscriptions(...args)));
    this.addProjectSubscriptions(atom.project.getPaths());

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'focus:set-focus': () => updateState({selectViewShowing: true})
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
    this.projectSubscriptions && this.projectSubscriptions.dispose();
  },
};
