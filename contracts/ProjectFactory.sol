
// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./Project.sol";

/*
   ProjectFactory Contract that is responsible for creating mulitple uniqu Project Contracts 
*/
   
contract ProjectFactory {

    address[] public projects;
    uint public numberProjects;

    event ProjectCreated(address indexed creator, uint indexed projectId, uint goal);
    
    /// @notice Function to create Project Contracts
    /// @param _goal target amount of money to fundraise as target in wei
    function createProject(uint256 _goal, string memory _badgeName, string memory _badgeSymbol) external {
        numberProjects+=1;
        Project _newProject = new Project(msg.sender, numberProjects, _goal, _badgeName, _badgeSymbol);
        address _project = address(_newProject);
        projects.push(_project);
        emit ProjectCreated(msg.sender, numberProjects, _goal);
    }
    
    /// @notice View all the Projects created by Factory
    /// @return array of addresses of the Project Contracts
    function getProjects() external view returns(address[] memory) {
        return projects;
    }

}
