import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Redirect, browserHistory, withRouter } from 'react-router';
import { Navbar, Nav, NavItem, NavDropdown, MenuItem, Glyphicon } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import Header from './Header.jsx';
import IssueAddNavItem from './IssueAddNavItem.jsx';
import IssueList from './IssueList.jsx';
import IssueEdit from './IssueEdit.jsx';
import IssueReport from './IssueReport.jsx';

const contentNode = document.getElementById('contents');
const NoMatch = () => <p>Page Not Found</p>;

const App = (props) => (
  <div>
    <Header />
    <div className="container-fluid">
      {props.children}
      <hr />
      <h5><small>
        Full source code available at this <a href="https:/github.com/vasansr/pro-mern-stack">
        Github repository</a>
      </small></h5>
    </div>
  </div>
);

App.propTypes = {
  children: React.PropTypes.object.isRequired,
};

const RoutedApp = () => (
  <Router history={browserHistory}>
    <Redirect from="/" to="/issues" />
    <Route path="/" component={App} >
      <Route path="issues" component={withRouter(IssueList)} />
      <Route path="issues/:id" component={IssueEdit} />
      <Route path="reports" component={withRouter(IssueReport)} />
      <Route path="*" component={NoMatch} />
    </Route>
  </Router>
);

ReactDOM.render(<RoutedApp />, contentNode); // Render the component inside the content Node

if (module.hot) {
  module.hot.accept();
}
