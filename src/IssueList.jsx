import React from 'react';
import 'whatwg-fetch';

import IssueFilter from './IssueFilter.jsx';
import IssueAdd from './IssueAdd.jsx';

export default class IssueList extends React.Component {
    constructor() {
        super();
        this.state = { issues: [] };

        // Need to bind this object to method as it will be called
        // from within a child component
        this.createIssue = this.createIssue.bind(this);
    }

    componentDidMount() {
        this.loadData();
    }

    // this is called outside the constructor to ensure that the component has
    // been correctly mounted within the DOM first.
    loadData() {
        fetch('http://localhost:8000/api/issues').then(response => {
            console.log(response);
            if (response.ok) {
                response.json().then(data => {
                    console.log("Total count of records:", data._metadata.total_count);
                    data.records.forEach(issue => {
                        issue.created = new Date(issue.created);
                        if (issue.completionDate)
                            issue.completionDate = new Date(issue.completionDate);
                    });
                    this.setState({issues: data.records });
                });
            } else {
                response.json().then(error => {
                    console.log("Failed to fetch issues: " + error.message);
                });
            }
        }).catch(err => {
            console.log("Error in fetching data from server: " + err);
        });
    }

    createIssue(newIssue) {
        fetch('http://localhost:8000/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newIssue)
        }).then( response => {
            if (response.ok) {
                response.json().then(updatedIssue => {
                    updatedIssue.created = new Date(updatedIssue.created);
                    if(updatedIssue.completionDate)
                        updatedIssue.completionDate = new Date(updatedIssue.completionDate);
                    const newIssues = this.state.issues.concat(updatedIssue);
                    this.setState({ issues: newIssues });
                });
            } else {
                response.json().then(error => {
                    console.error("Failed to add issue: " + error.message);
                });
            }
        }).catch(err => {
            console.error("Error in sending data to the server: " + err.message);
        });
    }

    render() {
        return(
            <div>
                <h1>Issue Tracker</h1>
                <IssueFilter />
                <hr />
                <IssueTable issues={this.state.issues}/>
                <hr />
                <IssueAdd createIssue={this.createIssue} />
            </div>
        );
    }
};


// changed to stateless function
function IssueRow(props){
    return (
        <tr>
            <td>{props.issue._id}</td>
            <td>{props.issue.status}</td>
            <td>{props.issue.owner}</td>
            <td>{props.issue.created.toDateString()}</td>
            <td>{props.issue.effort}</td>
            <td>{props.issue.completionDate ? props.issue.completionDate.toDateString() : ''}</td>
            <td>{props.issue.title}</td>
        </tr>
    );
}

// changed to stateless function
function IssueTable(props) {
    const issueRows = props.issues.map(issue => <IssueRow key={issue._id} issue={issue} />);
    return (
        <table className="bordered-table">
            <thead>
                <tr>
                    <th>Id</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Created</th>
                    <th>Effort</th>
                    <th>Completion Date</th>
                    <th>Title</th>
                </tr>
            </thead>
            <tbody>
                {issueRows}    
            </tbody>
        </table>
    );
}