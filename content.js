/*
  Ubersmith Auto Ticket Closer - Chrome Extension
  Automates mass closing of tickets in Ubersmith based on keyword matching with confirmation
  Also finds and closes matching "Problem:" and "Resolved:" tickets.
  Displays a UI list of tickets to be closed before confirming.
  Auto refreshes the extension periodically.
*/

// content.js - Injected into Ubersmith
(function() {
    console.log("Ubersmith Auto Ticket Closer extension loaded successfully.");

    function closeMatchingTickets(keyword) {
        // Select the correct tbody that contains the ticket list
        let tbodies = document.querySelectorAll("tbody");
        let ticketTableBody = tbodies[2]; // Directly selecting tbody[2]

        if (!ticketTableBody) {
            console.error("Could not find tbody[2].");
            alert("Could not find the correct ticket list.");
            return;
        }

        console.log("Selected tbody:", ticketTableBody);

        let ticketRows = ticketTableBody.querySelectorAll("tr");
        let matchingTickets = [];
        let problemTickets = new Map();
        
        ticketRows.forEach((row, index) => {
            // Highlight the row while iterating
            row.style.transition = "background-color 0.3s ease";
            row.style.backgroundColor = "#fffa90"; // Light yellow highlight
            
            setTimeout(() => {
                row.style.backgroundColor = ""; // Reset after 1 second
            }, 1000);

            let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']"); // Checkbox
            let ticketNumberCell = row.querySelector("td:nth-child(2)"); // Ticket number
            let subjectCell = row.querySelector("td:nth-child(3) a"); // Subject inside <a>

            if (!checkboxCell || !ticketNumberCell || !subjectCell) {
                console.warn(`Row ${index} is missing one or more required elements.`);
                return;
            }

            let subjectText = subjectCell.innerText.trim();
            let ticketNumber = ticketNumberCell.innerText.trim();

            console.log(`Checking Ticket #${ticketNumber} | Subject: ${subjectText}`);

            // Store "Problem:" tickets to find their corresponding "Resolved:" tickets
            if (subjectText.startsWith("Problem:")) {
                let baseSubject = subjectText.replace("Problem:", "").trim();
                problemTickets.set(baseSubject, { checkbox: checkboxCell, ticketNumber, subjectText });
            }
            
            // Find and close "Resolved:" tickets that match a "Problem:" ticket
            if (subjectText.startsWith("Resolved:")) {
                let baseSubject = subjectText.replace("Resolved:", "").trim();
                if (problemTickets.has(baseSubject)) {
                    matchingTickets.push({ checkbox: checkboxCell, ticketNumber, subjectText });
                    matchingTickets.push(problemTickets.get(baseSubject));
                    row.style.backgroundColor = "#ff6666"; // Highlight matching tickets in red
                }
            }
            
            if (subjectText.includes(keyword)) {
                matchingTickets.push({ checkbox: checkboxCell, ticketNumber, subjectText });
                row.style.backgroundColor = "#ff6666"; // Highlight matching tickets in red
            }
        });

        console.log(`Found ${matchingTickets.length} matching tickets.`);

        if (matchingTickets.length === 0) {
            alert("No matching tickets found.");
            return;
        }

        // Display UI List of tickets to be closed
        let ticketListContainer = document.createElement("div");
        ticketListContainer.style.position = "fixed";
        ticketListContainer.style.top = "20px";
        ticketListContainer.style.left = "20px";
        ticketListContainer.style.width = "300px";
        ticketListContainer.style.maxHeight = "400px";
        ticketListContainer.style.overflowY = "auto";
        ticketListContainer.style.backgroundColor = "white";
        ticketListContainer.style.border = "1px solid #ccc";
        ticketListContainer.style.padding = "10px";
        ticketListContainer.style.zIndex = "1000";

        let title = document.createElement("h3");
        title.innerText = "Tickets to be closed:";
        title.style.marginTop = "0";
        ticketListContainer.appendChild(title);

        let ticketList = document.createElement("ul");
        matchingTickets.forEach(ticket => {
            let listItem = document.createElement("li");
            listItem.innerText = `#${ticket.ticketNumber}: ${ticket.subjectText}`;
            ticketList.appendChild(listItem);
        });
        ticketListContainer.appendChild(ticketList);

        let confirmButton = document.createElement("button");
        confirmButton.innerText = "Confirm Close";
        confirmButton.style.marginTop = "10px";
        confirmButton.style.backgroundColor = "#FF5733";
        confirmButton.style.color = "white";
        confirmButton.style.padding = "5px";
        confirmButton.style.border = "none";
        confirmButton.style.cursor = "pointer";
        confirmButton.onclick = () => {
            matchingTickets.forEach(ticket => ticket.checkbox.checked = true);
            
            let actionDropdown = document.querySelector("#action_type");
            if (!actionDropdown) {
                console.error("Action dropdown not found!");
                alert("Could not find bulk action dropdown. Please check page structure.");
                return;
            }
            actionDropdown.value = "3";

            let submitButton = document.querySelector("#action_update");
            if (!submitButton) {
                console.error("Submit button not found!");
                alert("Could not find submit button.");
                return;
            }

            console.log("Closing tickets...");
            submitButton.click();
            
            setTimeout(() => {
                location.reload();
            }, 3000);
        };

        ticketListContainer.appendChild(confirmButton);
        document.body.appendChild(ticketListContainer);
    }

    // Auto refresh the extension every 5 minutes
    setInterval(() => {
        location.reload();
    }, 300000); // 300000ms = 5 minutes

})();
