import React from 'react';

export default class IssueFilter extends React.Component {
    constructor() {
        super();
        this.clearFilter = this.clearFilter.bind(this);
        this.setFilterOpen = this.setFilterOpen.bind(this);
        this.setFilterAssigned = this.setFilterAssigned.bind(this);
    }
    
    setFilterOpen(e) {
        e.preventDefault();
        this.props.setFilter({ status: 'Open' });
    }

    setFilterAssigned(e) {
        e.preventDefault();
        this.props.setFilter({ status: 'Assigned' });
    }
 
    clearFilter(e) {
        e.preventDefault();
        this.props.setFilter({});
    }

    render() {
        const Separator = () => <span> | </span>;
        return (
            <div>
                Status:
                <select value={this.state.status} onChange={this.onChangeStatus}>
                    <option value="">(Any)</option>
                    <option value="New">New</option>
                    <option value="Open">Open</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Fixed">Fixed</option>
                    <option value="Verified">Verified</option>
                    <option value="Closed">Closed</option>
                </select>
                &nbsp;Effort between:
                <input size={5} value={this.state.effort_gte} onChange={this.onChangeEffortGte} />
                &nbsp;-&nbsp;
                <input size={5} value={this.state.effort_lte} onChange={this.onChangeEffortLte} />
                <button onClick={this.applyFilter}>Apply</button>
                <button onClick={this.resetFilter} disabled={!this.state.changed}>Reset</button>
                <button onClick={this.clearFitler}>Clear</button>
            </div>
        );
    }
}

IssueFilter.propTypes = {
    setFilter: React.PropTypes.func.isRequired,
};