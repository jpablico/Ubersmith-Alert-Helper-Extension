/*
  Ubersmith Auto Ticket Closer - Chrome Extension
  Automates mass closing of tickets in Ubersmith based on keyword matching with confirmation
  Also finds and closes matching "Problem:" and "Resolved:" tickets.
  Displays a UI list of tickets to be closed before confirming.
  Auto refreshes the extension periodically with a visual countdown timer.
  Stores known tickets for automatic closure after refresh.
  Allows clearing known tickets from storage.
*/

// content.js - Injected into Ubersmith
(function() {
    console.log("Ubersmith Auto Ticket Closer extension loaded successfully.");

    let knownTickets = JSON.parse(localStorage.getItem("knownTickets")) || [];

    // Ensure UI elements always exist
    let existingInput = document.getElementById("keywordInput");
    let existingButton = document.getElementById("autoCloseButton");
    let existingClearButton = document.getElementById("clearKnownTicketsButton");
    let existingTimer = document.getElementById("refreshTimer");

    if (!existingInput) {
        let keywordInput = document.createElement("input");
        keywordInput.id = "keywordInput";
        keywordInput.type = "text";
        keywordInput.placeholder = "Enter keyword to close tickets";
        keywordInput.style.position = "fixed";
        keywordInput.style.bottom = "140px";
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
        autoCloseButton.style.bottom = "100px";
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

    if (!existingClearButton) {
        let clearKnownTicketsButton = document.createElement("button");
        clearKnownTicketsButton.id = "clearKnownTicketsButton";
        clearKnownTicketsButton.innerText = "Clear Known Tickets";
        clearKnownTicketsButton.style.position = "fixed";
        clearKnownTicketsButton.style.bottom = "60px";
        clearKnownTicketsButton.style.left = "20px";
        clearKnownTicketsButton.style.backgroundColor = "#555";
        clearKnownTicketsButton.style.color = "white";
        clearKnownTicketsButton.style.padding = "10px";
        clearKnownTicketsButton.style.border = "none";
        clearKnownTicketsButton.style.cursor = "pointer";
        document.body.appendChild(clearKnownTicketsButton);

        clearKnownTicketsButton.addEventListener("click", () => {
            localStorage.removeItem("knownTickets");
            knownTickets = [];
            alert("Known tickets cleared.");
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

    setTimeout(startRefreshTimer, 1000);
})();
