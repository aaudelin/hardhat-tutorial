// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract TodoList {
    event Log(address indexed account, uint balance);

    enum Status {
        NONE,
        TODO,
        DOING,
        DONE
    }

    struct Task {
        uint id;
        string content;
        Status status;
        uint createdAt;
        address createdBy;
    }

    // Optimizes for writing instead of reading, array would also work
    mapping(uint => Task) private tasksList;
    uint private taskId;

    function create(string calldata content, Status status) external payable returns (Task memory) {
        require(msg.value == 0.01 ether, "You must send 0.01 ether");
        require(bytes(content).length > 0, "Content must not be empty");
        require(status != Status.NONE, "Status must be TODO, DOING or DONE");

        taskId += 1;
        msg.sender;
        Task memory task = Task(
            { 
                id: taskId, 
                content: content, 
                status: status, 
                createdAt: block.timestamp, 
                createdBy: msg.sender 
            }
        );
        tasksList[taskId] = task;

        emit Log(msg.sender, msg.sender.balance);
        emit Log(address(this), address(this).balance);
        

        return task;
    }

    function update(uint id, string calldata content, Status status) external returns (Task memory) {
        require(id > 0, "Id must be over 0");
        require(bytes(content).length > 0, "Content must not be empty");
        require(status != Status.NONE, "Status must be TODO, DOING or DONE");

        // Using mutability
        // Task storage taskMuted = tasksList[id];
        // taskMuted.content = content;
        // taskMuted.status = status;


        // Trying immutability here instead of using storage, is it more gas expensive ?
        Task memory task = tasksList[id];
        require(msg.sender == task.createdBy, "Unauthorized");

        if (task.id == 0) {
            revert("Task is not found");
        }

        task = Task(
            {
                id: task.id, 
                content: content, 
                status: status, 
                createdAt: task.createdAt, 
                createdBy: task.createdBy
            }
        );
        tasksList[task.id] = task;

        return task;
    }

    function remove(uint id) external returns (bool) {
        require(id > 0, "Id must be over 0");

        Task memory task = tasksList[id];
        require(msg.sender == task.createdBy, "Unauthorized");

        if (task.id == 0) {
            revert("Task is not found");
        }

        delete tasksList[id];

        (bool sent,) = msg.sender.call{value: 0.01 ether}("");
        require(sent);

        emit Log(msg.sender, msg.sender.balance);
        emit Log(address(this), address(this).balance);

        return true;
    }

    function getAll() external view returns (Task[] memory) {
        
        Task[] memory tasks = new Task[](taskId);
        uint j = 0;

        for (uint i = 0; i <= taskId; i++) {
            Task memory task = tasksList[i];
        
            if (task.id == 0 || task.createdBy != msg.sender) {
                continue;
            }

            tasks[j] = task;
            j++;
        }


        return tasks;
    }


}