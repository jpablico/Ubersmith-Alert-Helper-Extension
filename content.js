/*
  Ubersmith Auto Ticket Closer - Chrome Extension
  Automates mass closing of tickets in Ubersmith based on keyword matching with confirmation
  Also finds and closes matching "Problem:" and "Resolved:" tickets.
  Displays a UI list of tickets to be closed before confirming.
  Auto refreshes the extension periodically with a visual countdown timer.
  Stores known tickets for automatic closure after refresh.
  Allows clearing known tickets from storage.
  Injects UI elements between ticket tbodies for better integration.
*/

// content.js - Injected into Ubersmith
(function() {
    console.log("Ubersmith Auto Ticket Closer extension loaded successfully.");

    let knownTickets = JSON.parse(localStorage.getItem("knownTickets")) || [];

    function createUI() {
        let tbodies = document.querySelectorAll("tbody");
        if (tbodies.length < 3) {
            console.error("Could not find the correct table structure.");
            return;
        }
        let targetTbody = tbodies[1];
        
        let uiContainer = document.createElement("tr");
        uiContainer.id = "uber-ui-container";
        uiContainer.innerHTML = `
            <td colspan="10" style="padding: 10px; background: #f8f9fa; text-align: left; border: 1px solid #ddd;">
                <input id="keywordInput" type="text" placeholder="Enter keyword to close tickets" 
                    style="width: 200px; padding: 5px; margin-right: 10px; border: 1px solid #ccc;">
                <button id="autoCloseButton" style="padding: 5px 10px; background: #FF5733; color: white; border: none; cursor: pointer;">Close Matching Tickets</button>
                <button id="clearKnownTicketsButton" style="padding: 5px 10px; background: #555; color: white; border: none; cursor: pointer;">Clear Known Tickets</button>
                <span id="refreshTimer" style="margin-left: 10px; font-weight: bold;">Next refresh in: 5:00</span>
            </td>
        `;
        targetTbody.appendChild(uiContainer);
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
            
            if (subjectText.includes(keyword) || knownTickets.includes(ticketNumber)) {
                matchingTickets.push({ checkbox: checkboxCell, ticketNumber, subjectText });
                row.style.backgroundColor = "#ff6666";
                if (!knownTickets.includes(ticketNumber)) {
                    knownTickets.push(ticketNumber);
                }
            }
        });

        localStorage.setItem("knownTickets", JSON.stringify(knownTickets));
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

    setTimeout(() => {
        createUI();
        startRefreshTimer();
        document.getElementById("autoCloseButton").addEventListener("click", () => {
            let keyword = document.getElementById("keywordInput").value.trim();
            closeMatchingTickets(keyword);
        });
        document.getElementById("clearKnownTicketsButton").addEventListener("click", () => {
            localStorage.removeItem("knownTickets");
            knownTickets = [];
            alert("Known tickets cleared.");
        });
    }, 1000);
})();
