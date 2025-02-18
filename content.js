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

    // Ensure UI elements always exist
    let existingInput = document.getElementById("keywordInput");
    let existingButton = document.getElementById("autoCloseButton");

    if (!existingInput) {
        let keywordInput = document.createElement("input");
        keywordInput.id = "keywordInput";
        keywordInput.type = "text";
        keywordInput.placeholder = "Enter keyword to close tickets";
        keywordInput.style.position = "fixed";
        keywordInput.style.bottom = "60px";
        keywordInput.style.left = "20px";
        keywordInput.style.padding = "5px";
        keywordInput.style.border = "1px solid #ccc";
        document.body.appendChild(keywordInput);
    }

    if (!existingButton) {
        let autoCloseButton = document.createElement("button");
        autoCloseButton.id = "autoCloseButton";
        autoCloseButton.innerText = "Close Matching Tickets";
        autoCloseButton.style.position = "fixed";
        autoCloseButton.style.bottom = "20px";
        autoCloseButton.style.left = "20px";
        autoCloseButton.style.backgroundColor = "#FF5733";
        autoCloseButton.style.color = "white";
        autoCloseButton.style.padding = "10px";
        autoCloseButton.style.border = "none";
        autoCloseButton.style.cursor = "pointer";
        document.body.appendChild(autoCloseButton);

        autoCloseButton.addEventListener("click", () => {
            let keyword = document.getElementById("keywordInput").value.trim();
            closeMatchingTickets(keyword);
        });
    }

    function closeMatchingTickets(keyword) {
        let tbodies = document.querySelectorAll("tbody");
        let ticketTableBody = tbodies[2];

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
            row.style.transition = "background-color 0.3s ease";
            row.style.backgroundColor = "#fffa90"; 
            
            setTimeout(() => {
                row.style.backgroundColor = ""; 
            }, 1000);

            let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']");
            let ticketNumberCell = row.querySelector("td:nth-child(2)");
            let subjectCell = row.querySelector("td:nth-child(3) a");

            if (!checkboxCell || !ticketNumberCell || !subjectCell) {
                console.warn(`Row ${index} is missing one or more required elements.`);
                return;
            }

            let subjectText = subjectCell.innerText.trim();
            let ticketNumber = ticketNumberCell.innerText.trim();

            console.log(`Checking Ticket #${ticketNumber} | Subject: ${subjectText}`);

            if (subjectText.startsWith("Problem:")) {
                let baseSubject = subjectText.replace("Problem:", "").trim();
                problemTickets.set(baseSubject, { checkbox: checkboxCell, ticketNumber, subjectText });
            }
            
            if (subjectText.startsWith("Resolved:")) {
                let baseSubject = subjectText.replace("Resolved:", "").trim();
                if (problemTickets.has(baseSubject)) {
                    matchingTickets.push({ checkbox: checkboxCell, ticketNumber, subjectText });
                    matchingTickets.push(problemTickets.get(baseSubject));
                    row.style.backgroundColor = "#ff6666"; 
                }
            }
            
            if (subjectText.includes(keyword)) {
                matchingTickets.push({ checkbox: checkboxCell, ticketNumber, subjectText });
                row.style.backgroundColor = "#ff6666"; 
            }
        });

        console.log(`Found ${matchingTickets.length} matching tickets.`);

        if (matchingTickets.length === 0) {
            alert("No matching tickets found.");
            return;
        }

        let existingContainer = document.getElementById("ticketListContainer");
        if (existingContainer) {
            existingContainer.remove();
        }

        let ticketListContainer = document.createElement("div");
        ticketListContainer.id = "ticketListContainer";
        ticketListContainer.style.position = "fixed";
        ticketListContainer.style.top = "20px";
        ticketListContainer.style.left = "20px";
        ticketListContainer.style.width = "350px";
        ticketListContainer.style.maxHeight = "500px";
        ticketListContainer.style.overflowY = "auto";
        ticketListContainer.style.backgroundColor = "white";
        ticketListContainer.style.border = "1px solid #ccc";
        ticketListContainer.style.padding = "15px";
        ticketListContainer.style.zIndex = "1000";
        ticketListContainer.style.boxShadow = "2px 2px 10px rgba(0, 0, 0, 0.1)";

        let title = document.createElement("h3");
        title.innerText = "Tickets to be closed:";
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
        confirmButton.onclick = () => {
            matchingTickets.forEach(ticket => ticket.checkbox.checked = true);
            document.querySelector("#action_type").value = "3";
            document.querySelector("#action_update").click();
            setTimeout(() => location.reload(), 3000);
        };
        ticketListContainer.appendChild(confirmButton);
        document.body.appendChild(ticketListContainer);
    }

    setTimeout(() => {
        setInterval(() => {
            location.reload();
        }, 300000);
    }, 60000);
})();
