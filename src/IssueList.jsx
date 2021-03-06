import React from 'react';
import 'whatwg-fetch';
import { Link } from 'react-router';
import { Button, Glyphicon, Table, Panel, Pagination } from 'react-bootstrap';

import withToast from './withToast.jsx';
import IssueFilter from './IssueFilter.jsx';

// changed to stateless function
const IssueRow = (props) => {
    function onDeleteClick() {
        props.deleteIssue(props.issue._id);
    }
    
    return (
        <tr>
            <td><Link to={`/issues/${props.issue._id}`}>{props.issue._id.substr(-4)}</Link></td>
            <td>{props.issue.status}</td>
            <td>{props.issue.owner}</td>
            <td>{props.issue.created.toDateString()}</td>
            <td>{props.issue.effort}</td>
            <td>{props.issue.completionDate ? props.issue.completionDate.toDateString() : ''}</td>
            <td>{props.issue.title}</td>
            <td>
                <Button bsSize="xsmall" onClick={onDeleteClick}><Glyphicon glyph="trash" /></Button>
            </td>
        </tr>
    );
}

IssueRow.propTypes = {
    issue: React.PropTypes.object.isRequired,
    deleteIssue: React.PropTypes.func.isRequired,
};

// changed to stateless function
function IssueTable(props) {
    const issueRows = props.issues.map(issue => 
        <IssueRow key={issue._id} issue={issue} deleteIssue={props.deleteIssue} />
    );

    return (
        <Table bordered condensed hover responsive>
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Created</th>
                    <th>Effort</th>
                    <th>Completion Date</th>
                    <th>Title</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {issueRows}    
            </tbody>
        </Table>
    );
}

IssueTable.propTypes = {
    issues: React.PropTypes.array.isRequired,
    deleteIssue: React.PropTypes.func.isRequired,
};

const PAGE_SIZE = 10;

class IssueList extends React.Component {
    static dataFetcher({ urlBase, location }) {
        const query = Object.assign({}, location.query);
        const pageStr = query._page;
        if (pageStr) {
            delete query._page;
            query._offset = (parseInt(pageStr, 10) - 1) * PAGE_SIZE;
        }
        query._limit = PAGE_SIZE;
        const search = Object.keys(query).map(k => `${k}=${query[k]}`).join('&');
        return fetch(`${urlBase || ''}/api/issues?${search}`).then(response => {
            if(!response.ok) return response.json().then(error => Promise.reject(error));
            return response.json().then(data => ({ IssueList: data }));
        });
    }
    
    constructor(props, context) {
        super(props, context);
        
        let data;
        if(context.initialState && context.initialState.IssueList) {
            data = context.initialState.IssueList;
        } else {
            data = {metadata: {totalCount: 0 }, records: []};
        }

        const issues = data.records;
        issues.forEach(issue => {
            issue.created = new Date(issue.created);
            if(issue.completionDate) {
                issue.completionDate = new Date(issue.completionDate);
            }
        });
        this.state = { 
            issues,
            totalCount: data.metadata.totalCount,
        };

        // Need to bind this object to method as it will be called
        // from within a child component
        this.setFilter = this.setFilter.bind(this);
        this.selectPage = this.selectPage.bind(this);
        this.deleteIssue = this.deleteIssue.bind(this);
    }

    deleteIssue(id) {
        fetch(`/api/issues/${id}`, { method: 'DELETE' }).then(response => {
            if(!response.ok) alert('Failed to delete issue');
            else this.loadData();
        });
    } 

    componentDidMount() {
        this.loadData();
    }

    componentDidUpdate(prevProps) {
        const oldQuery = prevProps.location.query;
        const newQuery = this.props.location.query;
        if(oldQuery.status === newQuery.status
            && oldQuery.effort_gte === newQuery.effort_gte
            && oldQuery.effort_lte === newQuery.effort_lte
            && oldQuery._page === newQuery._page) {
            return;
        }
        this.loadData();
    }

    selectPage(eventKey) {
        const query = Object.assign(this.props.location.query, { _page: eventKey });
        this.props.router.push({ pathname: this.props.location.pathname, query });
    }

    setFilter(query) {
        this.props.router.push({ pathname: this.props.location.pathname, query });
    }

    // this is called outside the constructor to ensure that the component has
    // been correctly mounted within the DOM first.
    loadData() {
        IssueList.dataFetcher({ location: this.props.location })
            .then(data => {
                const issues = data.IssueList.records;
                // update dates to native JS date objects
                issues.forEach(issue => {
                    issue.created = new Date(issue.created);
                    if(issue.completionDate) {
                        issue.completionDate = new Date(issue.completionDate);
                    }
                });
                this.setState({ issues, totalCount: data.IssueList.metadata.totalCount });
            })
            .catch(err => {
                this.showError(`Error in fetching data from server: ${err}`);
            });
    }

    render() {
        return(
            <div>
                <Panel collapsible header="Filter">
                    <IssueFilter setFilter={this.setFilter} initFilter={this.props.location.query} />
                </Panel>
                <Pagination
                    items={Math.ceil(this.state.totalCount / PAGE_SIZE)}
                    activePage={parseInt(this.props.location.query._page || '1', 10)}
                    onSelect={this.selectPage}
                    maxButtons={7}
                    next prev boundaryLinks
                />
                <IssueTable issues={this.state.issues} deleteIssue={this.deleteIssue} />
            </div>
        );
    }
};

IssueList.propTypes = {
    location: React.PropTypes.object.isRequired,
    router: React.PropTypes.object,
    showError: React.PropTypes.func.isRequired,
};

const IssueListWithToast = withToast(IssueList);
IssueListWithToast.dataFetcher = IssueList.dataFetcher;

export default IssueListWithToast;