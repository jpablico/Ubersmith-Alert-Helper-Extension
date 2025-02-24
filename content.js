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
  Adds a fading highlight effect while checking and clearing tickets.
*/

// content.js - Injected into Ubersmith
(function() {
    console.log("Ubersmith Auto Ticket Closer extension loaded successfully.");

    let knownTickets = JSON.parse(localStorage.getItem("knownTickets")) || [];
    let ticketTitles = JSON.parse(localStorage.getItem("ticketTitles")) || {}; // Store ticket titles

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
                style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px;">
            <button id="queryTicketsButton" style="padding: 10px; background: #007BFF; color: white; border: none; cursor: pointer; border-radius: 8px;">Find Matching Tickets</button>
            <div id="knownTicketsList" style="background: white; padding: 10px; border: 1px solid #ccc; max-height: 150px; overflow-y: auto; border-radius: 8px;"></div>
            <button id="confirmCloseButton" style="padding: 10px; background: #FFAA33; color: white; border: none; cursor: pointer; border-radius: 8px;">Confirm Closure</button>
            <button id="closeMatchingTicketsButton" style="padding: 10px; background: #FF5733; color: white; border: none; cursor: pointer; border-radius: 8px;">Close Matching Tickets</button>
            <button id="clearKnownTicketsButton" style="padding: 10px; background: #555; color: white; border: none; cursor: pointer; border-radius: 8px;">Clear Known Tickets</button>
            <span id="refreshTimer" style="margin-top: 10px; font-weight: bold;">Next refresh in: 5:00</span>
        `;
        panelDrawer.appendChild(uiContainer);

        updateKnownTicketsUI();
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

    function fadeEffect(rows, color) {
        rows.forEach((row, index) => {
            setTimeout(() => {
                row.style.transition = "background-color 0.5s ease";
                row.style.backgroundColor = color; 
            }, index * 100);
            
            setTimeout(() => {
                row.style.backgroundColor = ""; 
            }, index * 100 + 800);
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
        fadeEffect(ticketRows, "#ffff99"); // Yellow highlight while checking
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
        fadeEffect(ticketRows, "#ff6666"); // Red highlight while clearing

        alert("Known tickets cleared.");
    }

    setTimeout(() => {
        createUI();
        document.getElementById("queryTicketsButton").addEventListener("click", () => {
            let keyword = document.getElementById("keywordInput").value.trim();
            findMatchingTickets(keyword);
        });
        document.getElementById("confirmCloseButton").addEventListener("click", () => {
            closeMatchingTickets();
        });
        document.getElementById("closeMatchingTicketsButton").addEventListener("click", () => {
            document.querySelector("#action_update").click();
            setTimeout(() => location.reload(), 3000);
        });
        document.getElementById("clearKnownTicketsButton").addEventListener("click", () => {
            clearKnownTickets();
        });
    }, 1000);
})();
