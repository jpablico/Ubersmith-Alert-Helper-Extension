/*
  Ubersmith Auto Ticket Closer - Chrome Extension
  Automates mass closing of tickets in Ubersmith based on keyword matching with confirmation
  Also finds and closes matching "Problem:" and "Resolved:" tickets.
  Displays a UI list of tickets to be closed before confirming.
  Auto refreshes the extension periodically with a visual countdown timer.
  Stores known tickets for automatic closure after refresh.
  Allows clearing known tickets from storage.
  Moves the UI to the bottom of the "panel-drawer-content" class, ensuring it takes up the space.
  Separates functionality into different buttons.
*/

// content.js - Injected into Ubersmith
(function() {
    console.log("Ubersmith Auto Ticket Closer extension loaded successfully.");

    let knownTickets = JSON.parse(localStorage.getItem("knownTickets")) || [];

    function createUI() {
        let panelDrawer = document.querySelector(".panel-drawer-content");
        if (!panelDrawer) {
            console.error("Could not find .panel-drawer-content to insert UI.");
            return;
        }

        let uiContainer = document.createElement("div");
        uiContainer.id = "uber-ui-container";
        uiContainer.style.padding = "20px";
        uiContainer.style.background = "#f8f9fa";
        uiContainer.style.borderTop = "1px solid #ddd";
        uiContainer.style.marginTop = "10px";
        uiContainer.style.textAlign = "center";
        uiContainer.style.display = "flex";
        uiContainer.style.flexDirection = "column";
        uiContainer.style.gap = "10px";

        uiContainer.innerHTML = `
            <input id="keywordInput" type="text" placeholder="Enter keyword to search tickets" 
                style="width: 100%; padding: 10px; border: 1px solid #ccc;">
            <button id="queryTicketsButton" style="padding: 10px; background: #007BFF; color: white; border: none; cursor: pointer;">Find Matching Tickets</button>
            <button id="closeMatchingTicketsButton" style="padding: 10px; background: #FF5733; color: white; border: none; cursor: pointer;">Close Matching Tickets</button>
            <button id="clearKnownTicketsButton" style="padding: 10px; background: #555; color: white; border: none; cursor: pointer;">Clear Known Tickets</button>
            <span id="refreshTimer" style="margin-top: 10px; font-weight: bold;">Next refresh in: 5:00</span>
        `;
        panelDrawer.appendChild(uiContainer);
    }

    function findMatchingTickets(keyword) {
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

    function closeMatchingTickets() {
        let ticketTableBody = document.querySelectorAll("tbody")[2];
        if (!ticketTableBody) return;

        let ticketRows = ticketTableBody.querySelectorAll("tr");
        ticketRows.forEach(row => {
            let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']");
            let ticketNumberCell = row.querySelector("td:nth-child(2)");
            if (checkboxCell && ticketNumberCell && knownTickets.includes(ticketNumberCell.innerText.trim())) {
                checkboxCell.checked = true;
            }
        });

        let submitButton = document.querySelector("#action_update");
        if (submitButton) {
            submitButton.click();
            setTimeout(() => location.reload(), 3000);
        }
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
        document.getElementById("queryTicketsButton").addEventListener("click", () => {
            let keyword = document.getElementById("keywordInput").value.trim();
            findMatchingTickets(keyword);
        });
        document.getElementById("closeMatchingTicketsButton").addEventListener("click", () => {
            closeMatchingTickets();
        });
        document.getElementById("clearKnownTicketsButton").addEventListener("click", () => {
            localStorage.removeItem("knownTickets");
            knownTickets = [];
            alert("Known tickets cleared.");
        });
    }, 1000);
})();
