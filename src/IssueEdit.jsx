import React from 'react';
import { Link } from 'react-router';

export default class IssueEdit extends React.Component {
    render() {
        return (
            <div>
                <p>This is a placeholder for the editing issue {this.props.params.id}.</p>
                <Link to="/issues">Back to issue list</Link>
            </div>
        );
    }
}

IssueEdit.propTypes = {
    params: React.PropTypes.object.isRequired,
}