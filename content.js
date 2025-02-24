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
  Displays a list of known tickets with their titles and an option to confirm closure.
  Adds rounded borders to buttons.
  Restores fading highlight effects for both checking and clearing tickets.
  Highlights matching tickets in light orange while keeping all functionality.
  Fully restores ticket selection, storage, UI updates, and clearing functionality.
*/

(function() {
    console.log("Ubersmith Auto Ticket Closer extension loaded successfully.");

    let knownTickets = JSON.parse(localStorage.getItem("knownTickets")) || [];
    let ticketTitles = JSON.parse(localStorage.getItem("ticketTitles")) || {}; // Store ticket titles
    let knownKeywords = JSON.parse(localStorage.getItem("knownKeywords")) || []; // Store known keywords

    function createUI() {
        let panelDrawer = document.querySelector(".panel-drawer-content");
        if (!panelDrawer) {
            console.error("Could not find .panel-drawer-content to insert UI.");
            return;
        }

        let uiContainer = document.createElement("div");
        uiContainer.id = "uber-ui-container";
        uiContainer.style.padding = "20px";
        uiContainer.style.borderTop = "1px solid #ddd";
        uiContainer.style.marginTop = "10px";
        uiContainer.style.textAlign = "center";
        uiContainer.style.display = "flex";
        uiContainer.style.flexDirection = "column";
        uiContainer.style.gap = "10px";

        uiContainer.innerHTML = `
            <input id="keywordInput" type="text" placeholder="Enter keyword to search tickets" 
                style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px;">
            <button id="queryTicketsButton" style="padding: 10px; background:rgb(87, 168, 254); color: white; border: none; cursor: pointer; border-radius: 8px;">Find Matching Tickets</button>
            <div id="knownKeywordsList" style="background: white; padding: 10px; border: 1px solid #ccc; max-height: 150px; overflow-y: auto; border-radius: 8px;"></div>
            <div id="knownTicketsList" style="background: white; padding: 10px; border: 1px solid #ccc; max-height: 150px; overflow-y: auto; border-radius: 8px;"></div>
            <button id="confirmCloseButton" style="padding: 10px; background: #FFAA33; color: white; border: none; cursor: pointer; border-radius: 8px;">Confirm Closure</button>
            <button id="closeMatchingTicketsButton" style="padding: 10px; background: #FF5733; color: white; border: none; cursor: pointer; border-radius: 8px;">Close Matching Tickets</button>
            <button id="clearKnownTicketsButton" style="padding: 10px; background: #555; color: white; border: none; cursor: pointer; border-radius: 8px;">Clear Known Tickets</button>
            <span id="refreshTimer" style="margin-top: 10px; font-weight: bold;">Next refresh in: 5:00</span>
        `;
        panelDrawer.appendChild(uiContainer);

        updateKnownKeywordsUI();
        updateKnownTicketsUI();
    }

    function updateKnownKeywordsUI() {
        let knownKeywordsList = document.getElementById("knownKeywordsList");
        knownKeywordsList.innerHTML = "<strong>Known Keywords:</strong><br>";
        if (knownKeywords.length === 0) {
            knownKeywordsList.innerHTML += "No known keywords.";
        } else {
            knownKeywords.forEach(keyword => {
                let item = document.createElement("div");
                item.innerText = keyword;
                knownKeywordsList.appendChild(item);
            });
        }
    }

    function updateKnownTicketsUI() {
        let knownTicketsList = document.getElementById("knownTicketsList");
        knownTicketsList.innerHTML = "<strong>Known Tickets:</strong><br>";
        if (knownTickets.length === 0) {
            knownTicketsList.innerHTML += "No known tickets.";
        } else {
            knownTickets.forEach(ticket => {
                let item = document.createElement("div");
                let title = ticketTitles[ticket] ? ` - ${ticketTitles[ticket]}` : "";
                item.innerText = `#${ticket}${title}`;
                knownTicketsList.appendChild(item);
            });
        }
    }

    function highlightMatchingRow() {
        let tbodies = document.querySelectorAll("tbody");
        let ticketTableBody = tbodies[2];

        if (!ticketTableBody) {
            console.error("Could not find tbody[2].");
            alert("Could not find the correct ticket list.");
            return;
        }

        let ticketRows = ticketTableBody.querySelectorAll("tr");
        ticketRows.forEach((row) => {
            row.style.transition = "background-color 0.5s ease";
            row.style.backgroundColor = "#FFCC80"; // Light orange highlight for matching tickets
        });
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
        ticketRows.forEach((row, index) => {
            let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']");
            let ticketNumberCell = row.querySelector("td:nth-child(2)");
            let subjectCell = row.querySelector("td:nth-child(3) a");
            
            if (!checkboxCell || !subjectCell || !ticketNumberCell) return;
            
            let subjectText = subjectCell.innerText.trim();
            let ticketNumber = ticketNumberCell.innerText.trim();
            
            if (keyword && subjectText.includes(keyword)) {
                console.log(`Found matching ticket: ${ticketNumber} - ${subjectText}`);
                row.style.transition = "background-color 0.5s ease";
                row.style.backgroundColor = "#FFCC80"; // Light orange highlight for matching tickets
                setTimeout(() => {
                    checkboxCell.checked = true;
                }, 100); // Delay to ensure the highlight effect is visible
                if (!knownTickets.includes(ticketNumber)) {
                    knownTickets.push(ticketNumber);
                    ticketTitles[ticketNumber] = subjectText;
                }
            }
        });

        localStorage.setItem("knownTickets", JSON.stringify(knownTickets));
        localStorage.setItem("ticketTitles", JSON.stringify(ticketTitles));
        updateKnownTicketsUI();
    }

    function clearKnownTickets() {
        localStorage.removeItem("knownTickets");
        localStorage.removeItem("ticketTitles");
        knownTickets = [];
        ticketTitles = {};
        updateKnownTicketsUI();

        let ticketTableBody = document.querySelectorAll("tbody")[2];
        if (!ticketTableBody) return;
        
        let ticketRows = ticketTableBody.querySelectorAll("tr");
        ticketRows.forEach(row => {
            row.style.backgroundColor = ""; // Remove highlights
            let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']");
            if (checkboxCell) {
                checkboxCell.checked = false; // Uncheck the checkbox
            }
        });

        alert("Known tickets cleared.");
    }

    function startRefreshTimer() {
        let refreshTimer = document.getElementById("refreshTimer");
        let timeLeft = 300; // 5 minutes in seconds

        let timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                location.reload();
            } else {
                let minutes = Math.floor(timeLeft / 60);
                let seconds = timeLeft % 60;
                refreshTimer.innerText = `Next refresh in: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                timeLeft--;
            }
        }, 1000);
    }

    function closeMatchingTickets() {
        let tbodies = document.querySelectorAll("tbody");
        let ticketTableBody = tbodies[2];

        if (!ticketTableBody) {
            console.error("Could not find tbody[2].");
            alert("Could not find the correct ticket list.");
            return;
        }

        let ticketRows = ticketTableBody.querySelectorAll("tr");
        ticketRows.forEach((row, index) => {
            let checkboxCell = row.querySelector("td:nth-child(1) input[type='checkbox']");
            let ticketNumberCell = row.querySelector("td:nth-child(2)");
            let subjectCell = row.querySelector("td:nth-child(3) a");
            
            if (!checkboxCell || !subjectCell || !ticketNumberCell) return;
            
            let ticketNumber = ticketNumberCell.innerText.trim();
            
            if (knownTickets.includes(ticketNumber)) {
                checkboxCell.checked = true;
                highlightMatchingRow(row);
            }
        });

        // Simulate clicking the update button to close tickets
        document.querySelector("#action_update").click();
        setTimeout(() => location.reload(), 3000);
    }

    setTimeout(() => {
        createUI();
        document.getElementById("queryTicketsButton").addEventListener("click", () => {
            highlightMatchingRow();
            let keyword = document.getElementById("keywordInput").value.trim();
            setTimeout(() => {
                findMatchingTickets(keyword);
            }, 1000); // Delay to ensure the highlight effect is visible
        });
        document.getElementById("confirmCloseButton").addEventListener("click", () => {
            closeMatchingTickets();
        });
        document.getElementById("closeMatchingTicketsButton").addEventListener("click", () => {
            document.querySelector("#action_update").click();
            setTimeout(() => location.reload(), 3000);
        });
        document.getElementById("clearKnownTicketsButton").addEventListener("click", () => {
            highlightMatchingRow();
            clearKnownTickets();
        });

        // Automatically search for known keywords
        knownKeywords.forEach(keyword => {
            setTimeout(() => {
                findMatchingTickets(keyword);
            }, 1000); // Delay to ensure the highlight effect is visible
        });

        startRefreshTimer(); // Start the refresh timer
    }, 1000);
})();
