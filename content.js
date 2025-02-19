/*
  Ubersmith Auto Ticket Closer - Chrome Extension
  Automates mass closing of tickets in Ubersmith based on keyword matching with confirmation
  Also finds and closes matching "Problem:" and "Resolved:" tickets.
  Displays a UI list of tickets to be closed before confirming.
  Auto refreshes the extension periodically with a visual countdown timer.
*/

// content.js - Injected into Ubersmith
(function() {
    console.log("Ubersmith Auto Ticket Closer extension loaded successfully.");

    // Ensure UI elements always exist
    let existingInput = document.getElementById("keywordInput");
    let existingButton = document.getElementById("autoCloseButton");
    let existingTimer = document.getElementById("refreshTimer");

    if (!existingInput) {
        let keywordInput = document.createElement("input");
        keywordInput.id = "keywordInput";
        keywordInput.type = "text";
        keywordInput.placeholder = "Enter keyword to close tickets";
        keywordInput.style.position = "fixed";
        keywordInput.style.bottom = "100px";
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
        autoCloseButton.style.bottom = "60px";
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

    if (!existingTimer) {
        let refreshTimer = document.createElement("div");
        refreshTimer.id = "refreshTimer";
        refreshTimer.style.position = "fixed";
        refreshTimer.style.bottom = "20px";
        refreshTimer.style.left = "20px";
        refreshTimer.style.backgroundColor = "#333";
        refreshTimer.style.color = "white";
        refreshTimer.style.padding = "5px 10px";
        refreshTimer.style.borderRadius = "5px";
        refreshTimer.style.fontSize = "14px";
        refreshTimer.innerText = "Next refresh in: 5:00";
        document.body.appendChild(refreshTimer);
    }

    function closeMatchingTickets(keyword) {
        let tbodies = document.querySelectorAll("tbody");
        let ticketTableBody = tbodies[2];

        if (!ticketTableBody) {
            console.error("Could not find tbody[2].");
            alert("Could not find the correct ticket list.");
            return;
        }

        let ticketRows = ticketTableBody.querySelectorAll("tr");
        let matchingTickets = [];
        
        ticketRows.forEach(row => {
            let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']");
            let ticketNumberCell = row.querySelector("td:nth-child(2)");
            let subjectCell = row.querySelector("td:nth-child(3) a");
            
            if (!checkboxCell || !subjectCell || !ticketNumberCell) return;
            
            let subjectText = subjectCell.innerText.trim();
            let ticketNumber = ticketNumberCell.innerText.trim();
            
            if (subjectText.includes(keyword)) {
                matchingTickets.push({ checkbox: checkboxCell, ticketNumber, subjectText });
                row.style.backgroundColor = "#ff6666";
            }
        });

        if (matchingTickets.length === 0) {
            alert("No matching tickets found.");
            return;
        }

        // Confirmation List UI
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

    function startRefreshTimer() {
        let remainingTime = 300;
        let timerInterval = setInterval(() => {
            remainingTime--;
            let minutes = Math.floor(remainingTime / 60);
            let seconds = remainingTime % 60;
            document.getElementById("refreshTimer").innerText = `Next refresh in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                location.reload();
            }
        }, 1000);
    }

    setTimeout(startRefreshTimer, 1000);
})();